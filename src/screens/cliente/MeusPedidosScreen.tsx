import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { CartaoPedido, ProximoPasso } from '../../components/CartaoPedido';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import {
  useContratacoes,
  useMinhasAvaliacoes,
  useMinhasSolicitacoes,
  useOrcamentos,
} from '../../hooks/consultas';
import { Orcamento } from '../../models/contratacao';
import { Solicitacao } from '../../models/solicitacao';
import { ClienteAbasParams, ClienteStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora, formatarMoeda } from '../../utils/formatacao';
import {
  EtapaPedido,
  contratacaoDoPedido,
  etapaDoPedido,
  orcamentosDoPedido,
  seloDaEtapa,
} from '../../utils/situacaoPedido';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClienteAbasParams, 'MeusPedidos'>,
  NativeStackScreenProps<ClienteStackParams>
>;

type Filtro = 'todos' | 'abertos' | 'andamento' | 'concluidos' | 'cancelados';

const filtros: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'abertos', rotulo: 'Abertos' },
  { valor: 'andamento', rotulo: 'Em andamento' },
  { valor: 'concluidos', rotulo: 'Concluídos' },
  { valor: 'cancelados', rotulo: 'Cancelados' },
];

const etapasDoFiltro: Record<Filtro, EtapaPedido[]> = {
  todos: ['orcamentos', 'contratado', 'execucao', 'concluido', 'cancelado'],
  abertos: ['orcamentos'],
  andamento: ['contratado', 'execucao'],
  concluidos: ['concluido'],
  cancelados: ['cancelado'],
};

export function MeusPedidosScreen({ navigation }: Props) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useMinhasSolicitacoes();
  const orcamentos = useOrcamentos();
  const contratacoes = useContratacoes();
  const avaliacoes = useMinhasAvaliacoes();
  const [filtro, setFiltro] = useState<Filtro>('todos');

  if (isLoading) return <Carregando texto="Buscando seus pedidos..." />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  const itens = (data?.conteudo ?? []).map((pedido) => {
    const contratacao = contratacaoDoPedido(pedido.id, contratacoes.data?.conteudo);
    const doPedido = orcamentosDoPedido(pedido.id, orcamentos.data?.conteudo);
    const etapa = etapaDoPedido(pedido, contratacao);
    const avaliado = avaliacoes.data?.conteudo.some((a) => a.solicitacaoId === pedido.id);
    return { pedido, contratacao, doPedido, etapa, avaliado };
  });
  const visiveis = itens.filter((i) => etapasDoFiltro[filtro].includes(i.etapa));

  function atualizar() {
    void refetch();
    void orcamentos.refetch();
    void contratacoes.refetch();
    void avaliacoes.refetch();
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={visiveis}
      keyExtractor={(i) => String(i.pedido.id)}
      ListHeaderComponent={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filtros}
        >
          <Opcoes<Filtro> opcoes={filtros} selecionado={filtro} aoSelecionar={setFiltro} />
        </ScrollView>
      }
      renderItem={({ item }) => {
        const pendentes = item.doPedido.filter((o) => o.status === 'Pendente');
        const aceito = item.doPedido.find((o) => o.id === item.contratacao?.orcamentoId);
        return (
          <CartaoPedido
            pedido={item.pedido}
            situacao={seloDaEtapa(item.etapa, pendentes.length)}
            valorCombinado={
              item.contratacao ? formatarMoeda(item.contratacao.valorAcordado) : undefined
            }
            proximoPasso={proximoPasso(item.etapa, item.pedido, pendentes, {
              nome: aceito?.prestadorNome ?? item.pedido.prestador?.nome,
              data: item.contratacao?.dataAgendada,
              avaliado: !!item.avaliado,
            })}
            aoPressionar={() => navigation.navigate('DetalhePedido', { id: item.pedido.id })}
          />
        );
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={atualizar}
          tintColor={cores.primaria}
        />
      }
      ListEmptyComponent={
        filtro === 'todos' ? (
          <EstadoVazio
            icone="construct-outline"
            titulo="Nenhum pedido ainda"
            texto="Descreva um problema na aba Novo pedido e receba orçamentos de prestadores do seu bairro."
          />
        ) : (
          <EstadoVazio
            icone="filter-outline"
            titulo="Nada por aqui"
            texto="Nenhum pedido nesta situação."
          />
        )
      }
    />
  );
}

/** O que o cliente precisa fazer (ou esperar) em cada etapa. */
function proximoPasso(
  etapa: EtapaPedido,
  pedido: Solicitacao,
  pendentes: Orcamento[],
  extra: { nome?: string; data?: string; avaliado: boolean },
): ProximoPasso | undefined {
  switch (etapa) {
    case 'orcamentos': {
      const contraproposta = pendentes.some((o) => o.propostaPendente?.autor === 'Prestador');
      if (contraproposta)
        return {
          texto: 'Contraproposta aguardando sua resposta',
          icone: 'swap-horizontal',
          destaque: true,
        };
      if (pendentes.length > 0)
        return {
          texto: `${pendentes.length} ${pendentes.length === 1 ? 'orçamento recebido' : 'orçamentos recebidos'} · toque para comparar`,
          icone: 'pricetags-outline',
          destaque: true,
        };
      return { texto: 'Aguardando orçamentos dos prestadores', icone: 'hourglass-outline' };
    }
    case 'contratado':
      return {
        texto: [extra.nome, extra.data && `agendado para ${formatarDataHora(extra.data)}`]
          .filter(Boolean)
          .join(' · '),
        icone: 'calendar-outline',
      };
    case 'execucao':
      return {
        texto: `${extra.nome ?? 'O prestador'} está realizando o serviço`,
        icone: 'construct-outline',
      };
    case 'concluido':
      return extra.avaliado
        ? {
            texto: `Serviço feito por ${extra.nome ?? 'prestador'} · avaliado`,
            icone: 'checkmark-done-outline',
          }
        : { texto: 'Avalie o prestador', icone: 'star-outline', destaque: true };
    case 'cancelado':
      return pedido.motivoCancelamento
        ? { texto: `Motivo: ${pedido.motivoCancelamento}`, icone: 'close-circle-outline' }
        : undefined;
  }
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  filtros: { paddingBottom: espacos.sm },
});
