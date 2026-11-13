import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves } from '../../hooks/consultas';
import { Triagem } from '../../models/solicitacao';
import { ClienteAbasParams, ClienteStackParams } from '../../navigation/tipos';
import { criarSolicitacao, simularTriagem } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaPedido, validar } from '../../validation/esquemas';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClienteAbasParams, 'NovoPedido'>,
  NativeStackScreenProps<ClienteStackParams>
>;

/**
 * Passo 1: o morador descreve o problema e a IA faz a triagem (previa).
 * Passo 2: ele confere categoria, urgencia e preco justo e confirma o pedido.
 */
export function NovoPedidoScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = useState('');
  const [bairro, setBairro] = useState(usuario?.bairro ?? '');
  const [erroCampo, setErroCampo] = useState('');
  const [triagem, setTriagem] = useState<Triagem | null>(null);

  const analisar = useMutation({ mutationFn: simularTriagem, onSuccess: setTriagem });

  const confirmar = useMutation({
    mutationFn: criarSolicitacao,
    onSuccess: (pedido) => {
      queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
      setDescricao('');
      setTriagem(null);
      navigation.navigate('DetalhePedido', { id: pedido.id });
    },
  });

  async function aoAnalisar() {
    const erros = await validar(esquemaPedido, { descricao });
    setErroCampo(erros.descricao ?? '');
    if (erros.descricao) return;
    setTriagem(null);
    analisar.mutate(descricao.trim());
  }

  function aoEditarDescricao(texto: string) {
    setDescricao(texto);
    if (triagem) setTriagem(null); // a analise antiga nao vale para o texto novo
  }

  return (
    <TelaFormulario>
      <Text style={estilos.ola}>Ola, {usuario?.nome.split(' ')[0]}!</Text>
      <Text style={estilos.titulo}>O que precisa de conserto?</Text>
      <Text style={estilos.subtitulo}>
        Conte com suas palavras. A gente identifica o tipo de servico, a urgencia e quanto e justo pagar.
      </Text>

      <CampoTexto
        rotulo="Descreva o problema"
        multiline
        placeholder="Ex.: a tomada da cozinha esta soltando faisca quando ligo a geladeira"
        value={descricao}
        onChangeText={aoEditarDescricao}
        erro={erroCampo}
        maxLength={1000}
      />
      <CampoTexto rotulo="Bairro do servico" value={bairro} onChangeText={setBairro} />

      {!triagem && (
        <Botao titulo="Analisar meu problema" aoPressionar={aoAnalisar} carregando={analisar.isPending} />
      )}
      {analisar.isPending && (
        <Text style={estilos.aguarde}>Analisando o problema... isso pode levar alguns segundos.</Text>
      )}
      {analisar.isError && <Text style={estilos.erro}>{mensagemDeErro(analisar.error)}</Text>}

      {triagem && (
        <>
          <CartaoTriagem
            categoria={triagem.categoria.nome}
            urgencia={triagem.urgencia}
            precoMinimo={triagem.precoMinimo}
            precoMaximo={triagem.precoMaximo}
            resumo={triagem.resumo}
            dicaSeguranca={triagem.dicaSeguranca}
            origem={triagem.origem}
            prestadoresDisponiveis={triagem.prestadoresDisponiveis}
          />
          {confirmar.isError && <Text style={estilos.erro}>{mensagemDeErro(confirmar.error)}</Text>}
          <Botao
            titulo="Confirmar pedido"
            aoPressionar={() => confirmar.mutate({ descricao: descricao.trim(), bairro: bairro.trim() })}
            carregando={confirmar.isPending}
          />
          <Botao
            titulo="Mudar a descricao"
            variante="contorno"
            aoPressionar={() => setTriagem(null)}
            estilo={estilos.botaoSecundario}
          />
        </>
      )}
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  ola: { fontFamily: fontes.media, fontSize: tamanhos.medio, color: cores.primaria },
  titulo: { fontFamily: fontes.negrito, fontSize: tamanhos.titulo, color: cores.texto },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.lg,
  },
  aguarde: {
    fontFamily: fontes.regular,
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: espacos.sm,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  botaoSecundario: { marginTop: espacos.sm },
});
