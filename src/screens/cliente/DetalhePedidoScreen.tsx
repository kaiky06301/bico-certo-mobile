import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { Carregando, MensagemErro } from '../../components/Estados';
import { Estrelas } from '../../components/Estrelas';
import { Negociacao } from '../../components/Negociacao';
import { Opcoes } from '../../components/Opcoes';
import { Selo } from '../../components/Selo';
import { seloContratacao, seloOrcamento, seloStatusPedido } from '../../components/selos';
import { Subtitulo, Titulo } from '../../components/Titulo';
import { chaves, useContratacoes, useOrcamentos, useSolicitacao } from '../../hooks/consultas';
import { Orcamento, PosicaoNaFaixa } from '../../models/contratacao';
import { ClienteStackParams } from '../../navigation/tipos';
import { aceitarOrcamento, alterarStatusContratacao } from '../../services/orcamentoService';
import { avaliarSolicitacao, cancelarSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { opcoesDeAgendamento } from '../../utils/agenda';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora, formatarMoeda, gerarChaveUnica } from '../../utils/formatacao';

type Props = NativeStackScreenProps<ClienteStackParams, 'DetalhePedido'>;

const textoFaixa: Record<PosicaoNaFaixa, string> = {
  Abaixo: ' · abaixo da faixa de referência',
  Dentro: ' · dentro da faixa de referência',
  Acima: ' · acima da faixa de referência',
  SemReferencia: '',
};

export function DetalhePedidoScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const pedido = useSolicitacao(id);
  const orcamentos = useOrcamentos(id);
  const contratacoes = useContratacoes();

  const [escolhido, setEscolhido] = useState<Orcamento | null>(null);
  const [dataAgendada, setDataAgendada] = useState<string>();
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [avaliado, setAvaliado] = useState(false);
  // Mesma chave enquanto o cliente estiver confirmando o MESMO orcamento: um reenvio nao duplica a contratacao
  const chaveContratacao = useRef(gerarChaveUnica());
  const datas = useMemo(() => opcoesDeAgendamento(), []);

  const contratacao = contratacoes.data?.conteudo.find(
    (c) => c.solicitacaoId === id && c.status !== 'Cancelada',
  );

  function atualizarTudo() {
    queryClient.invalidateQueries({ queryKey: chaves.solicitacao(id) });
    queryClient.invalidateQueries({ queryKey: chaves.orcamentos(id) });
    queryClient.invalidateQueries({ queryKey: chaves.contratacoes });
    queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
  }

  const contratar = useMutation({
    mutationFn: () =>
      aceitarOrcamento(
        { orcamentoId: escolhido!.id, dataAgendada: dataAgendada! },
        chaveContratacao.current,
      ),
    onSuccess: () => {
      setEscolhido(null);
      chaveContratacao.current = gerarChaveUnica();
      atualizarTudo();
      Alert.alert('Serviço contratado!', 'O prestador já pode ver o agendamento.');
    },
  });

  const cancelar = useMutation({
    mutationFn: async () => {
      if (contratacao && contratacao.status !== 'Concluida') {
        await alterarStatusContratacao(contratacao.id, 'Cancelada');
      }
      await cancelarSolicitacao(id);
    },
    onSuccess: () => {
      atualizarTudo();
      navigation.goBack();
    },
    onError: (erro) => Alert.alert('Não foi possível cancelar', mensagemDeErro(erro)),
  });

  const avaliar = useMutation({
    mutationFn: () => avaliarSolicitacao(id, nota, comentario.trim() || undefined),
    onSuccess: () => setAvaliado(true),
  });

  function escolher(orcamento: Orcamento) {
    if (escolhido?.id !== orcamento.id) chaveContratacao.current = gerarChaveUnica();
    setEscolhido(orcamento);
    setDataAgendada(undefined);
  }

  function confirmarCancelamento() {
    Alert.alert('Cancelar pedido?', 'Os prestadores deixam de ver este pedido.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar pedido', style: 'destructive', onPress: () => cancelar.mutate() },
    ]);
  }

  if (pedido.isLoading) return <Carregando />;
  if (pedido.isError || !pedido.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(pedido.error)}
        aoTentarDeNovo={() => void pedido.refetch()}
      />
    );
  }

  const p = pedido.data;
  const status = seloStatusPedido[p.status];
  const podeEditar = p.status === 'ABERTA' && !contratacao;
  const podeCancelar = p.status === 'ABERTA' || p.status === 'EM_ATENDIMENTO';
  const listaOrcamentos = orcamentos.data?.conteudo ?? [];

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={pedido.isRefetching}
          onRefresh={atualizarTudo}
          tintColor={cores.primaria}
        />
      }
    >
      <View style={estilos.topo}>
        <Text style={estilos.numero}>Pedido #{p.id}</Text>
        <Selo texto={status.texto} tom={status.tom} />
      </View>
      <Text style={estilos.descricao}>{p.descricao}</Text>
      <Text style={estilos.meta}>
        {p.bairro} · aberto em {formatarDataHora(p.criadaEm)}
      </Text>

      <CartaoTriagem
        categoria={p.categoria.nome}
        urgencia={p.urgencia}
        precoMinimo={p.precoMinimo}
        precoMaximo={p.precoMaximo}
        resumo={p.resumoTriagem}
        dicaSeguranca={p.dicaSeguranca}
        origem={p.origemTriagem}
      />

      {contratacao && (
        <>
          <Titulo>Serviço contratado</Titulo>
          <Cartao>
            <View style={estilos.linha}>
              <Text style={estilos.valor}>{formatarMoeda(contratacao.valorAcordado)}</Text>
              <Selo
                texto={seloContratacao[contratacao.status].texto}
                tom={seloContratacao[contratacao.status].tom}
              />
            </View>
            <Text style={estilos.meta}>
              Agendado para {formatarDataHora(contratacao.dataAgendada)}
            </Text>
            {p.prestador && (
              <View style={estilos.contato}>
                <Ionicons name="person-circle-outline" size={22} color={cores.secundaria} />
                <Text style={estilos.contatoNome}>{p.prestador.nome}</Text>
                {!!p.prestador.telefone && (
                  <Botao
                    titulo="Ligar"
                    variante="contorno"
                    estilo={estilos.botaoLigar}
                    aoPressionar={() => Linking.openURL(`tel:${p.prestador?.telefone}`)}
                  />
                )}
              </View>
            )}
          </Cartao>
        </>
      )}

      {p.status === 'ABERTA' && !contratacao && (
        <>
          <Titulo>Orçamentos recebidos</Titulo>
          {orcamentos.isLoading && <Subtitulo>Buscando orçamentos...</Subtitulo>}
          {orcamentos.isError && <Subtitulo>{mensagemDeErro(orcamentos.error)}</Subtitulo>}
          {!orcamentos.isLoading && listaOrcamentos.length === 0 && (
            <Subtitulo>
              Os prestadores do seu bairro já foram avisados. Os orçamentos aparecem aqui.
            </Subtitulo>
          )}
          {listaOrcamentos.map((orcamento) => {
            const selo = seloOrcamento[orcamento.status];
            return (
              <Cartao
                key={orcamento.id}
                estilo={escolhido?.id === orcamento.id ? estilos.escolhido : undefined}
              >
                <View style={estilos.linha}>
                  <Text style={estilos.prestador}>{orcamento.prestadorNome}</Text>
                  <Selo texto={selo.texto} tom={selo.tom} />
                </View>
                <Text style={estilos.valor}>{formatarMoeda(orcamento.valor)}</Text>
                <Text style={estilos.meta}>
                  Prazo: {orcamento.prazoDias} dia(s)
                  {textoFaixa[orcamento.posicaoNaFaixa]}
                </Text>
                {orcamento.posicaoNaFaixa === 'Acima' && (
                  <Selo texto="Acima da faixa de referência" tom="alerta" />
                )}
                {!!orcamento.observacao && (
                  <Text style={estilos.observacao}>
                    {orcamento.posicaoNaFaixa === 'Acima' ? 'Motivo: ' : ''}
                    {`“${orcamento.observacao}”`}
                  </Text>
                )}
                {orcamento.status === 'Pendente' && escolhido?.id !== orcamento.id && (
                  <Negociacao orcamento={orcamento} eu="Cliente" precoMaximo={p.precoMaximo} />
                )}
                {orcamento.status === 'Pendente' && escolhido?.id !== orcamento.id && (
                  <Botao
                    titulo="Contratar por este valor"
                    aoPressionar={() => escolher(orcamento)}
                    estilo={estilos.botaoCartao}
                  />
                )}
                {escolhido?.id === orcamento.id && (
                  <View style={estilos.agendar}>
                    <Text style={estilos.rotulo}>Quando o prestador pode ir?</Text>
                    <Opcoes<string>
                      opcoes={datas}
                      selecionado={dataAgendada}
                      aoSelecionar={setDataAgendada}
                    />
                    {contratar.isError && (
                      <Text style={estilos.erro}>{mensagemDeErro(contratar.error)}</Text>
                    )}
                    <Botao
                      titulo="Confirmar contratação"
                      desabilitado={!dataAgendada}
                      carregando={contratar.isPending}
                      aoPressionar={() => contratar.mutate()}
                    />
                    <Botao
                      titulo="Voltar"
                      variante="contorno"
                      estilo={estilos.botaoCartao}
                      aoPressionar={() => setEscolhido(null)}
                    />
                  </View>
                )}
              </Cartao>
            );
          })}
        </>
      )}

      {p.status === 'CONCLUIDA' && (
        <>
          <Titulo>Avalie o prestador</Titulo>
          {avaliado ? (
            <Cartao>
              <Text style={estilos.obrigado}>
                Obrigado! Sua avaliação ajuda seus vizinhos a escolher bem.
              </Text>
            </Cartao>
          ) : (
            <Cartao>
              <Estrelas nota={nota} aoMudar={setNota} />
              <CampoTexto
                rotulo="Comentário (opcional)"
                multiline
                value={comentario}
                onChangeText={setComentario}
                maxLength={500}
              />
              {avaliar.isError && <Text style={estilos.erro}>{mensagemDeErro(avaliar.error)}</Text>}
              <Botao
                titulo="Enviar avaliação"
                carregando={avaliar.isPending}
                aoPressionar={() => avaliar.mutate()}
              />
            </Cartao>
          )}
        </>
      )}

      <View style={estilos.acoes}>
        {podeEditar && (
          <Botao
            titulo="Editar pedido"
            variante="secundaria"
            aoPressionar={() => navigation.navigate('EditarPedido', { id })}
          />
        )}
        {podeCancelar && (
          <Botao
            titulo="Cancelar pedido"
            variante="perigo"
            carregando={cancelar.isPending}
            aoPressionar={confirmarCancelamento}
          />
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.textoSuave },
  descricao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.medio,
    color: cores.texto,
    marginTop: espacos.sm,
  },
  meta: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginVertical: espacos.xs,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacos.sm,
  },
  prestador: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
    flexShrink: 1,
  },
  valor: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.primariaEscura,
    marginTop: espacos.xs,
  },
  observacao: {
    fontFamily: fontes.regular,
    fontStyle: 'italic',
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  escolhido: { borderColor: cores.primaria, borderWidth: 2 },
  botaoCartao: { marginTop: espacos.sm },
  agendar: { marginTop: espacos.md },
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginBottom: espacos.sm,
  },
  contato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    marginTop: espacos.sm,
    padding: espacos.sm,
    backgroundColor: cores.secundariaClara,
    borderRadius: raio.medio,
  },
  contatoNome: { flex: 1, fontFamily: fontes.media, color: cores.secundaria },
  botaoLigar: { minHeight: 36 },
  obrigado: { fontFamily: fontes.media, color: cores.sucesso, textAlign: 'center' },
  acoes: { gap: espacos.sm, marginTop: espacos.lg },
});
