import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Botao } from '../../components/Botao';
import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import { Selo } from '../../components/Selo';
import { seloContratacao } from '../../components/selos';
import { chaves, useContratacoes } from '../../hooks/consultas';
import { Contratacao } from '../../models/contratacao';
import { PrestadorAbasParams, PrestadorStackParams } from '../../navigation/tipos';
import { alterarStatusContratacao, reagendarContratacao } from '../../services/orcamentoService';
import {
  assumirSolicitacao,
  buscarSolicitacao,
  concluirSolicitacao,
  desistirSolicitacao,
} from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import {
  DIAS_CURTOS,
  diasAte,
  horario,
  inicioDoDia,
  opcoesDeAgendamento,
  tituloDoDia,
} from '../../utils/agenda';
import { mensagemDeErro } from '../../utils/erros';
import { formatarMoeda } from '../../utils/formatacao';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PrestadorAbasParams, 'Agenda'>,
  NativeStackScreenProps<PrestadorStackParams>
>;

type Filtro = 'proximos' | 'hoje' | 'amanha' | 'semana' | 'concluidos' | 'cancelados';

const ATIVOS = ['Agendada', 'EmAndamento'];

function passaNoFiltro(c: Contratacao, filtro: Filtro, agora: Date): boolean {
  const dias = diasAte(new Date(c.dataAgendada), agora);
  const ativo = ATIVOS.includes(c.status);
  switch (filtro) {
    case 'proximos':
      return ativo;
    case 'hoje':
      return ativo && dias === 0;
    case 'amanha':
      return ativo && dias === 1;
    case 'semana':
      return ativo && dias >= 0 && dias < 7;
    case 'concluidos':
      return c.status === 'Concluida';
    case 'cancelados':
      return c.status === 'Cancelada';
  }
}

/**
 * Agenda do prestador: semana no topo (quantos serviços por dia), filtros e os serviços agrupados por dia,
 * com as ações do dia a dia (iniciar, concluir, ver rota, reagendar e desistir).
 */
export function AgendaScreen({ navigation }: Props) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useContratacoes();
  const [filtro, setFiltro] = useState<Filtro>('proximos');
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null);
  const [agora] = useState(() => new Date());
  const semana = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = inicioDoDia(agora);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [agora],
  );

  if (isLoading) return <Carregando texto="Carregando sua agenda..." />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  const todas = data?.conteudo ?? [];
  const ativosPorDia = semana.map(
    (d) =>
      todas.filter((c) => ATIVOS.includes(c.status) && diasAte(new Date(c.dataAgendada), d) === 0)
        .length,
  );

  const visiveis = todas
    .filter((c) =>
      diaEscolhido !== null
        ? ATIVOS.includes(c.status) && diasAte(new Date(c.dataAgendada), agora) === diaEscolhido
        : passaNoFiltro(c, filtro, agora),
    )
    .sort((a, b) =>
      filtro === 'concluidos' || filtro === 'cancelados'
        ? b.dataAgendada.localeCompare(a.dataAgendada)
        : a.dataAgendada.localeCompare(b.dataAgendada),
    );

  // agrupa por dia (SectionList)
  const secoes: { title: string; data: Contratacao[] }[] = [];
  for (const c of visiveis) {
    const titulo = tituloDoDia(new Date(c.dataAgendada), agora);
    const secao = secoes.find((s) => s.title === titulo);
    if (secao) secao.data.push(c);
    else secoes.push({ title: titulo, data: [c] });
  }

  return (
    <SectionList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      sections={secoes}
      keyExtractor={(c) => String(c.id)}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.semana}
          >
            {semana.map((d, i) => {
              const ativo = diaEscolhido === i;
              return (
                <Pressable
                  key={d.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={`${tituloDoDia(d, agora)}: ${ativosPorDia[i]} serviço(s)`}
                  onPress={() => setDiaEscolhido(ativo ? null : i)}
                  style={[estilos.dia, ativo && estilos.diaAtivo]}
                >
                  <Text style={[estilos.diaSemana, ativo && estilos.textoAtivo]}>
                    {i === 0 ? 'Hoje' : DIAS_CURTOS[d.getDay()]}
                  </Text>
                  <Text style={[estilos.diaNumero, ativo && estilos.textoAtivo]}>
                    {d.getDate()}
                  </Text>
                  <Text
                    style={[
                      estilos.diaQtd,
                      ativo && estilos.textoAtivo,
                      ativosPorDia[i] === 0 && estilos.livre,
                    ]}
                  >
                    {ativosPorDia[i] === 0 ? 'livre' : `${ativosPorDia[i]} serv.`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {diaEscolhido === null ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Opcoes<Filtro>
                opcoes={[
                  { valor: 'proximos', rotulo: 'Próximos' },
                  { valor: 'hoje', rotulo: 'Hoje' },
                  { valor: 'amanha', rotulo: 'Amanhã' },
                  { valor: 'semana', rotulo: 'Esta semana' },
                  { valor: 'concluidos', rotulo: 'Concluídos' },
                  { valor: 'cancelados', rotulo: 'Cancelados' },
                ]}
                selecionado={filtro}
                aoSelecionar={setFiltro}
              />
            </ScrollView>
          ) : (
            <Text style={estilos.voltarFiltros} onPress={() => setDiaEscolhido(null)}>
              Mostrando só {tituloDoDia(semana[diaEscolhido], agora).toLowerCase()} · ver todos
            </Text>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={estilos.secao}>{section.title}</Text>}
      renderItem={({ item }) => (
        <CartaoAgenda
          contratacao={item}
          aoAbrir={() => navigation.navigate('DetalheServico', { id: item.solicitacaoId })}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={cores.primaria}
        />
      }
      ListEmptyComponent={
        <EstadoVazio
          icone="calendar-outline"
          titulo="Nada agendado aqui"
          texto="Quando um cliente aceitar o seu orçamento, o serviço aparece na agenda."
        />
      }
    />
  );
}

function CartaoAgenda({
  contratacao: c,
  aoAbrir,
}: {
  contratacao: Contratacao;
  aoAbrir: () => void;
}) {
  const queryClient = useQueryClient();
  const [reagendando, setReagendando] = useState(false);
  const [novaData, setNovaData] = useState<string>();
  const datas = useMemo(() => opcoesDeAgendamento(), []);
  // o prestador contratado lê o pedido (cliente, bairro e, depois da contratação, a rua)
  const pedido = useQuery({
    queryKey: chaves.solicitacao(c.solicitacaoId),
    queryFn: () => buscarSolicitacao(c.solicitacaoId),
    retry: false,
  });
  const p = pedido.data;
  const selo = seloContratacao[c.status];
  const data = new Date(c.dataAgendada);

  function atualizar() {
    queryClient.invalidateQueries({ queryKey: chaves.contratacoes });
    queryClient.invalidateQueries({ queryKey: chaves.solicitacao(c.solicitacaoId) });
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    queryClient.invalidateQueries({ queryKey: chaves.abertas });
  }

  const iniciar = useMutation({
    mutationFn: async () => {
      if (p?.status === 'ABERTA') await assumirSolicitacao(c.solicitacaoId);
      await alterarStatusContratacao(c.id, 'EmAndamento');
    },
    onSuccess: atualizar,
    onError: (e) => Alert.alert('Não foi possível iniciar', mensagemDeErro(e)),
  });
  const concluir = useMutation({
    mutationFn: async () => {
      if (p?.status === 'EM_ATENDIMENTO') await concluirSolicitacao(c.solicitacaoId);
      await alterarStatusContratacao(c.id, 'Concluida');
    },
    onSuccess: atualizar,
    onError: (e) => Alert.alert('Não foi possível concluir', mensagemDeErro(e)),
  });
  const reagendar = useMutation({
    mutationFn: () => reagendarContratacao(c.id, novaData!),
    onSuccess: () => {
      setReagendando(false);
      atualizar();
    },
  });
  const desistir = useMutation({
    mutationFn: async () => {
      await alterarStatusContratacao(c.id, 'Cancelada');
      if (p?.status === 'EM_ATENDIMENTO') await desistirSolicitacao(c.solicitacaoId);
    },
    onSuccess: atualizar,
    onError: (e) => Alert.alert('Não foi possível cancelar', mensagemDeErro(e)),
  });

  function abrirRota() {
    if (!p?.endereco) return;
    const destino = encodeURIComponent(p.endereco);
    void Linking.openURL(
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destino}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destino}`,
    );
  }

  function confirmarDesistencia() {
    Alert.alert(
      'Cancelar este agendamento?',
      'O cliente é avisado e os outros orçamentos do pedido voltam a ficar disponíveis para ele.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar agendamento', style: 'destructive', onPress: () => desistir.mutate() },
      ],
    );
  }

  const ativo = ATIVOS.includes(c.status);

  return (
    <Cartao aoPressionar={aoAbrir} estilo={!ativo ? estilos.inativo : undefined}>
      <View style={estilos.linha}>
        <View style={estilos.hora}>
          <Ionicons name="time-outline" size={18} color={cores.secundaria} />
          <Text style={estilos.horaTexto}>{horario(data)}</Text>
        </View>
        <Selo texto={selo.texto} tom={selo.tom} />
      </View>
      <View style={estilos.linha}>
        <Text style={estilos.categoria}>{p?.categoria.nome ?? `Pedido #${c.solicitacaoId}`}</Text>
        <Text style={estilos.valor}>{formatarMoeda(c.valorAcordado)}</Text>
      </View>
      {p && (
        <>
          <Info icone="person-outline" texto={p.cliente.nome} />
          <Info icone="location-outline" texto={p.endereco ? `${p.endereco}` : p.bairro} />
        </>
      )}
      <Text style={estilos.meta}>Pedido #{c.solicitacaoId}</Text>

      {ativo && (
        <View style={estilos.acoes}>
          {c.status === 'Agendada' && (
            <Botao
              titulo="Iniciar serviço"
              carregando={iniciar.isPending}
              aoPressionar={() => iniciar.mutate()}
            />
          )}
          {c.status === 'EmAndamento' && (
            <Botao
              titulo="Concluir serviço"
              variante="secundaria"
              carregando={concluir.isPending}
              aoPressionar={() => concluir.mutate()}
            />
          )}
          <View style={estilos.links}>
            {!!p?.endereco && (
              <Link icone="map-outline" texto="Ver rota" aoPressionar={abrirRota} />
            )}
            {c.status === 'Agendada' && (
              <Link
                icone="calendar-outline"
                texto="Reagendar"
                aoPressionar={() => setReagendando(true)}
              />
            )}
            <Link
              icone="close-circle-outline"
              texto="Cancelar"
              perigo
              aoPressionar={confirmarDesistencia}
            />
          </View>
        </View>
      )}

      <Modal
        visible={reagendando}
        transparent
        animationType="slide"
        onRequestClose={() => setReagendando(false)}
      >
        <View style={estilos.fundoModal}>
          <View style={estilos.folha}>
            <Text style={estilos.tituloModal}>Reagendar serviço</Text>
            <Text style={estilos.meta}>
              Hoje: {tituloDoDia(data)} às {horario(data)}. O cliente é avisado da nova data.
            </Text>
            <Opcoes<string> opcoes={datas} selecionado={novaData} aoSelecionar={setNovaData} />
            {reagendar.isError && (
              <Text style={estilos.erro}>{mensagemDeErro(reagendar.error)}</Text>
            )}
            <Botao
              titulo="Confirmar nova data"
              desabilitado={!novaData}
              carregando={reagendar.isPending}
              aoPressionar={() => reagendar.mutate()}
            />
            <Botao
              titulo="Voltar"
              variante="contorno"
              estilo={estilos.espaco}
              aoPressionar={() => setReagendando(false)}
            />
          </View>
        </View>
      </Modal>
    </Cartao>
  );
}

function Info({ icone, texto }: { icone: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={estilos.info}>
      <Ionicons name={icone} size={16} color={cores.textoSuave} />
      <Text style={estilos.infoTexto}>{texto}</Text>
    </View>
  );
}

function Link(props: {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  aoPressionar: () => void;
  perigo?: boolean;
}) {
  const cor = props.perigo ? cores.perigo : cores.secundaria;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.aoPressionar}
      hitSlop={6}
      style={({ pressed }) => [estilos.link, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={props.icone} size={18} color={cor} />
      <Text style={[estilos.linkTexto, { color: cor }]}>{props.texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  semana: { gap: espacos.xs, paddingBottom: espacos.md },
  dia: {
    width: 64,
    alignItems: 'center',
    paddingVertical: espacos.sm,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  diaAtivo: { backgroundColor: cores.secundaria, borderColor: cores.secundaria },
  diaSemana: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  diaNumero: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  diaQtd: { fontFamily: fontes.seminegrito, fontSize: 11, color: cores.primariaEscura },
  livre: { color: cores.sucesso, fontFamily: fontes.regular },
  textoAtivo: { color: cores.branco },
  voltarFiltros: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.secundaria,
    textDecorationLine: 'underline',
    marginBottom: espacos.md,
  },
  secao: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginTop: espacos.sm,
    marginBottom: espacos.sm,
  },
  inativo: { opacity: 0.65 },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacos.sm,
  },
  hora: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  horaTexto: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  categoria: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
    marginTop: espacos.sm,
  },
  valor: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.medio,
    color: cores.sucesso,
    marginTop: espacos.sm,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm, marginTop: espacos.xs },
  infoTexto: { flex: 1, fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.texto },
  meta: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  acoes: {
    marginTop: espacos.md,
    paddingTop: espacos.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    gap: espacos.sm,
  },
  links: { flexDirection: 'row', justifyContent: 'space-around' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40 },
  linkTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal },
  fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: raio.grande,
    borderTopRightRadius: raio.grande,
    padding: espacos.lg,
    paddingBottom: espacos.xl * 1.5,
  },
  tituloModal: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  erro: { fontFamily: fontes.media, color: cores.perigo, marginBottom: espacos.sm },
  espaco: { marginTop: espacos.sm },
});
