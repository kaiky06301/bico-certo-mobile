import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { Cartao } from '../../components/Cartao';
import { CartaoAvaliacao } from '../../components/CartaoAvaliacao';
import { Carregando, MensagemErro } from '../../components/Estados';
import { Negociacao } from '../../components/Negociacao';
import { Opcoes } from '../../components/Opcoes';
import { ResumoPrestador } from '../../components/ResumoPrestador';
import { Selo } from '../../components/Selo';
import {
  chaves,
  useAvaliacoesPrestador,
  useOrcamentos,
  usePerfilPrestador,
  useSolicitacao,
} from '../../hooks/consultas';
import { PosicaoNaFaixa } from '../../models/contratacao';
import { ClienteStackParams } from '../../navigation/tipos';
import { aceitarOrcamento, recusarOrcamento } from '../../services/orcamentoService';
import { registrarContratacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { opcoesDeAgendamento } from '../../utils/agenda';
import { mensagemDeErro } from '../../utils/erros';
import { formatarFaixa, formatarMoeda, gerarChaveUnica } from '../../utils/formatacao';

type Props = NativeStackScreenProps<ClienteStackParams, 'PropostaOrcamento'>;

const textoFaixa: Record<PosicaoNaFaixa, { texto: string; tom: 'sucesso' | 'alerta' | 'neutro' }> =
  {
    Abaixo: { texto: 'Abaixo da faixa de referência', tom: 'sucesso' },
    Dentro: { texto: 'Dentro da faixa de referência', tom: 'sucesso' },
    Acima: { texto: 'Acima da faixa de referência', tom: 'alerta' },
    SemReferencia: { texto: 'Sem faixa de referência', tom: 'neutro' },
  };

/**
 * Uma proposta de orçamento: quem é o prestador (perfil e avaliações), o valor e as condições,
 * a negociação e as decisões do cliente (aceitar e agendar, ou recusar).
 */
export function PropostaOrcamentoScreen({ route, navigation }: Props) {
  const { solicitacaoId, orcamentoId } = route.params;
  const queryClient = useQueryClient();
  const pedido = useSolicitacao(solicitacaoId);
  const orcamentos = useOrcamentos(solicitacaoId);
  const orcamento = orcamentos.data?.conteudo.find((o) => o.id === orcamentoId);
  const perfil = usePerfilPrestador(orcamento?.prestadorId ?? 0);
  const avaliacoes = useAvaliacoesPrestador(perfil.data?.id);

  const [agendando, setAgendando] = useState(false);
  const [dataAgendada, setDataAgendada] = useState<string>();
  const datas = useMemo(() => opcoesDeAgendamento(), []);
  // mesma chave enquanto confirma o MESMO orcamento: um reenvio nao duplica a contratacao
  const chave = useRef(gerarChaveUnica());

  function atualizar() {
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    queryClient.invalidateQueries({ queryKey: chaves.solicitacao(solicitacaoId) });
    queryClient.invalidateQueries({ queryKey: chaves.contratacoes });
    queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
  }

  const contratar = useMutation({
    mutationFn: async () => {
      await aceitarOrcamento({ orcamentoId, dataAgendada: dataAgendada! }, chave.current);
      // a API Java libera a rua e o telefone para o prestador contratado
      await registrarContratacao(solicitacaoId, orcamento!.prestadorId);
    },
    onSuccess: () => {
      atualizar();
      Alert.alert('Serviço contratado!', 'O prestador já pode ver o agendamento e o endereço.');
      navigation.goBack();
    },
  });

  const recusar = useMutation({
    mutationFn: () => recusarOrcamento(orcamentoId),
    onSuccess: () => {
      atualizar();
      navigation.goBack();
    },
    onError: (erro) => Alert.alert('Não foi possível recusar', mensagemDeErro(erro)),
  });

  function confirmarRecusa() {
    Alert.alert(
      'Recusar este orçamento?',
      'O prestador é avisado de que você não vai contratá-lo neste pedido.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Recusar', style: 'destructive', onPress: () => recusar.mutate() },
      ],
    );
  }

  if (orcamentos.isLoading || pedido.isLoading) return <Carregando />;
  if (!orcamento || !pedido.data) {
    return (
      <MensagemErro
        mensagem={
          orcamentos.isError ? mensagemDeErro(orcamentos.error) : 'Orçamento não encontrado.'
        }
        aoTentarDeNovo={() => void orcamentos.refetch()}
      />
    );
  }

  const p = pedido.data;
  const faixa = textoFaixa[orcamento.posicaoNaFaixa];
  const pendente = orcamento.status === 'Pendente';
  const ultimas = avaliacoes.data?.conteudo.slice(0, 3) ?? [];

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      {/* quem é o prestador */}
      <Cartao>
        <ResumoPrestador
          usuarioId={orcamento.prestadorId}
          nome={orcamento.prestadorNome}
          tamanhoAvatar={64}
        />
        {!!perfil.data?.descricao && <Text style={estilos.bio}>{perfil.data.descricao}</Text>}
        {!!perfil.data?.disponibilidade && (
          <Text style={estilos.textoSuave}>Atende: {perfil.data.disponibilidade}</Text>
        )}
        <Text
          accessibilityRole="link"
          style={estilos.link}
          onPress={() =>
            navigation.navigate('PerfilPrestador', { usuarioId: orcamento.prestadorId })
          }
        >
          Ver perfil completo
        </Text>
      </Cartao>

      {/* a proposta */}
      <Cartao estilo={estilos.bloco}>
        <Text style={estilos.secao}>VALOR PROPOSTO</Text>
        <Text style={estilos.valor}>{formatarMoeda(orcamento.valor)}</Text>
        {orcamento.valor !== orcamento.valorInicial && (
          <Text style={estilos.textoSuave}>
            Valor negociado (o orçamento original era {formatarMoeda(orcamento.valorInicial)})
          </Text>
        )}
        <View style={estilos.selos}>
          <Selo texto={faixa.texto} tom={faixa.tom} />
          {!pendente && <Selo texto={orcamento.status} tom="neutro" />}
        </View>
        <Text style={estilos.textoSuave}>
          Referência da análise: {formatarFaixa(p.precoMinimo, p.precoMaximo)}
        </Text>

        <View style={estilos.divisor} />
        <Text style={estilos.secao}>PRAZO</Text>
        <Text style={estilos.texto}>
          {orcamento.prazoDias} {orcamento.prazoDias === 1 ? 'dia' : 'dias'}
        </Text>

        {!!orcamento.observacao && (
          <>
            <View style={estilos.divisor} />
            <Text style={estilos.secao}>
              {orcamento.posicaoNaFaixa === 'Acima' ? 'MOTIVO DO VALOR' : 'O QUE ESTÁ INCLUSO'}
            </Text>
            <Text style={estilos.texto}>{orcamento.observacao}</Text>
          </>
        )}

        {pendente && (
          <>
            <View style={estilos.divisor} />
            <Negociacao orcamento={orcamento} eu="Cliente" precoMaximo={p.precoMaximo} />
          </>
        )}
      </Cartao>

      {/* decisão */}
      {pendente && !agendando && (
        <View style={estilos.acoes}>
          <Botao
            titulo={`Aceitar por ${formatarMoeda(orcamento.valor)}`}
            aoPressionar={() => setAgendando(true)}
          />
          <Botao
            titulo="Recusar orçamento"
            variante="contorno"
            carregando={recusar.isPending}
            aoPressionar={confirmarRecusa}
          />
        </View>
      )}
      {pendente && agendando && (
        <Cartao estilo={estilos.bloco}>
          <Text style={estilos.subtitulo}>Quando o prestador pode ir?</Text>
          <Opcoes<string>
            opcoes={datas}
            selecionado={dataAgendada}
            aoSelecionar={setDataAgendada}
          />
          <Text style={estilos.textoSuave}>
            Ao confirmar, o prestador passa a ver a rua, o número e o seu telefone.
          </Text>
          {contratar.isError && <Text style={estilos.erro}>{mensagemDeErro(contratar.error)}</Text>}
          <Botao
            titulo="Confirmar contratação"
            desabilitado={!dataAgendada}
            carregando={contratar.isPending}
            aoPressionar={() => contratar.mutate()}
            estilo={estilos.espaco}
          />
          <Botao
            titulo="Voltar"
            variante="contorno"
            aoPressionar={() => setAgendando(false)}
            estilo={estilos.espaco}
          />
        </Cartao>
      )}

      {/* avaliações */}
      <Text style={[estilos.subtitulo, estilos.espacoGrande]}>Avaliações de outros vizinhos</Text>
      {ultimas.length === 0 ? (
        <Text style={estilos.textoSuave}>Este prestador ainda não recebeu avaliações.</Text>
      ) : (
        ultimas.map((a) => <CartaoAvaliacao key={a.id} avaliacao={a} titulo={a.cliente} />)
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  bloco: { marginTop: espacos.md },
  bio: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginTop: espacos.md,
  },
  link: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.secundaria,
    textDecorationLine: 'underline',
    marginTop: espacos.sm,
    paddingVertical: espacos.xs,
  },
  secao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    letterSpacing: 0.5,
    marginBottom: espacos.xs,
  },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.titulo, color: cores.primariaEscura },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.xs, marginVertical: espacos.sm },
  texto: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.texto },
  textoSuave: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espacos.md },
  acoes: { gap: espacos.sm, marginTop: espacos.md },
  subtitulo: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  erro: { fontFamily: fontes.media, color: cores.perigo, marginTop: espacos.sm },
  espaco: { marginTop: espacos.sm },
  espacoGrande: { marginTop: espacos.lg },
});
