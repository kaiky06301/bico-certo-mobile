import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Carregando, MensagemErro } from '../../components/Estados';
import { TelaFormulario } from '../../components/TelaFormulario';
import { chaves, useSolicitacao } from '../../hooks/consultas';
import { Solicitacao } from '../../models/solicitacao';
import { ClienteStackParams } from '../../navigation/tipos';
import { atualizarSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaPedido, validar } from '../../validation/esquemas';

type Props = NativeStackScreenProps<ClienteStackParams, 'EditarPedido'>;

export function EditarPedidoScreen({ route, navigation }: Props) {
  const pedido = useSolicitacao(route.params.id);

  if (pedido.isLoading) return <Carregando />;
  if (pedido.isError || !pedido.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(pedido.error)}
        aoTentarDeNovo={() => void pedido.refetch()}
      />
    );
  }
  return <FormularioEdicao pedido={pedido.data} aoSalvar={() => navigation.goBack()} />;
}

/** O formulario so e montado com o pedido ja carregado, entao os campos ja nascem preenchidos. */
function FormularioEdicao({ pedido, aoSalvar }: { pedido: Solicitacao; aoSalvar: () => void }) {
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = useState(pedido.descricao);
  const [bairro, setBairro] = useState(pedido.bairro);
  const [erroCampo, setErroCampo] = useState('');

  const salvar = useMutation({
    mutationFn: () =>
      atualizarSolicitacao(pedido.id, { descricao: descricao.trim(), bairro: bairro.trim() }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(chaves.solicitacao(pedido.id), atualizado);
      queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
      aoSalvar();
    },
  });

  async function aoConfirmar() {
    const erros = await validar(esquemaPedido, { descricao });
    setErroCampo(erros.descricao ?? '');
    if (!erros.descricao) salvar.mutate();
  }

  return (
    <TelaFormulario>
      <Text style={estilos.aviso}>
        Ao salvar, o problema é analisado de novo: a categoria, a urgência e a faixa de preço de
        referência podem mudar.
      </Text>
      <CampoTexto
        rotulo="Descrição do problema"
        multiline
        value={descricao}
        onChangeText={setDescricao}
        erro={erroCampo}
        maxLength={1000}
      />
      <CampoTexto rotulo="Bairro" value={bairro} onChangeText={setBairro} />
      {salvar.isError && <Text style={estilos.erro}>{mensagemDeErro(salvar.error)}</Text>}
      <Botao titulo="Salvar alterações" aoPressionar={aoConfirmar} carregando={salvar.isPending} />
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
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginBottom: espacos.md,
  },
});
