import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Carregando, MensagemErro } from '../../components/Estados';
import { TelaFormulario } from '../../components/TelaFormulario';
import { chaves, useSolicitacao } from '../../hooks/consultas';
import { ClienteStackParams } from '../../navigation/tipos';
import { atualizarSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaPedido, validar } from '../../validation/esquemas';

type Props = NativeStackScreenProps<ClienteStackParams, 'EditarPedido'>;

export function EditarPedidoScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const pedido = useSolicitacao(id);
  const [descricao, setDescricao] = useState('');
  const [bairro, setBairro] = useState('');
  const [erroCampo, setErroCampo] = useState('');

  useEffect(() => {
    if (pedido.data) {
      setDescricao(pedido.data.descricao);
      setBairro(pedido.data.bairro);
    }
  }, [pedido.data]);

  const salvar = useMutation({
    mutationFn: () => atualizarSolicitacao(id, { descricao: descricao.trim(), bairro: bairro.trim() }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(chaves.solicitacao(id), atualizado);
      queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
      navigation.goBack();
    },
  });

  async function aoSalvar() {
    const erros = await validar(esquemaPedido, { descricao });
    setErroCampo(erros.descricao ?? '');
    if (!erros.descricao) salvar.mutate();
  }

  if (pedido.isLoading) return <Carregando />;
  if (pedido.isError) return <MensagemErro mensagem={mensagemDeErro(pedido.error)} aoTentarDeNovo={() => void pedido.refetch()} />;

  return (
    <TelaFormulario>
      <Text style={estilos.aviso}>
        Ao salvar, o problema e analisado de novo: a categoria, a urgencia e o preco justo podem mudar.
      </Text>
      <CampoTexto
        rotulo="Descricao do problema"
        multiline
        value={descricao}
        onChangeText={setDescricao}
        erro={erroCampo}
        maxLength={1000}
      />
      <CampoTexto rotulo="Bairro" value={bairro} onChangeText={setBairro} />
      {salvar.isError && <Text style={estilos.erro}>{mensagemDeErro(salvar.error)}</Text>}
      <Botao titulo="Salvar alteracoes" aoPressionar={aoSalvar} carregando={salvar.isPending} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.secundaria,
    backgroundColor: cores.secundariaClara,
    padding: espacos.md,
    borderRadius: 12,
    marginBottom: espacos.lg,
  },
  erro: { fontFamily: fontes.media, color: cores.perigo, textAlign: 'center', marginBottom: espacos.md },
});
