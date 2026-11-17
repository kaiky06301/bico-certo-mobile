import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import { Selo } from '../../components/Selo';
import { useContratacoes, useOrcamentos } from '../../hooks/consultas';
import { Contratacao, Orcamento } from '../../models/contratacao';
import { PrestadorAbasParams, PrestadorStackParams } from '../../navigation/tipos';
import { buscarSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora, formatarMoeda, formatarQuando } from '../../utils/formatacao';
import {
  SituacaoPrestador,
  seloDoPrestador,
  situacaoDoPrestador,
} from '../../utils/situacaoPrestador';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PrestadorAbasParams, 'MeusOrcamentos'>,
  NativeStackScreenProps<PrestadorStackParams>
>;

type Filtro = 'todos' | 'aguardando' | 'negociacao' | 'contratados' | 'encerrados';

const situacoesDoFiltro: Record<Filtro, SituacaoPrestador[]> = {
  todos: [
    'enviado',
    'negociacao',
    'suaVez',
    'contratado',
    'execucao',
    'concluido',
    'outroContratado',
    'recusado',
  ],
  aguardando: ['enviado'],
  negociacao: ['negociacao', 'suaVez'],
  contratados: ['contratado', 'execucao', 'concluido'],
  encerrados: ['outroContratado', 'recusado'],
};

/** Meus orçamentos: tudo o que o prestador já orçou, com a situação de cada negociação. */
export function MeusOrcamentosScreen({ navigation }: Props) {
  const orcamentos = useOrcamentos();
  const contratacoes = useContratacoes();
  const [filtro, setFiltro] = useState<Filtro>('todos');

  if (orcamentos.isLoading) return <Carregando texto="Buscando seus orçamentos..." />;
  if (orcamentos.isError)
    return (
      <MensagemErro
        mensagem={mensagemDeErro(orcamentos.error)}
        aoTentarDeNovo={() => void orcamentos.refetch()}
      />
    );

  const itens = (orcamentos.data?.conteudo ?? []).map((o) => {
    const contratacao = contratacoes.data?.conteudo.find(
      (c) => c.orcamentoId === o.id && c.status !== 'Cancelada',
    );
    return { o, contratacao, situacao: situacaoDoPrestador(o, contratacao) };
  });
  const suaVez = itens.filter((i) => i.situacao === 'suaVez').length;
  const visiveis = itens.filter((i) => situacoesDoFiltro[filtro].includes(i.situacao));

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={visiveis}
      keyExtractor={(i) => String(i.o.id)}
      ListHeaderComponent={
        <>
          {suaVez > 0 && (
            <Text style={estilos.alerta}>
              {suaVez === 1
                ? '1 cliente está esperando sua resposta.'
                : `${suaVez} clientes estão esperando sua resposta.`}
            </Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Opcoes<Filtro>
              opcoes={[
                { valor: 'todos', rotulo: 'Todos' },
                { valor: 'aguardando', rotulo: 'Aguardando' },
                { valor: 'negociacao', rotulo: `Negociação${suaVez ? ` (${suaVez})` : ''}` },
                { valor: 'contratados', rotulo: 'Contratados' },
                { valor: 'encerrados', rotulo: 'Não escolhidos' },
              ]}
              selecionado={filtro}
              aoSelecionar={setFiltro}
            />
          </ScrollView>
        </>
      }
      renderItem={({ item }) => (
        <CartaoOrcamento
          orcamento={item.o}
          contratacao={item.contratacao}
          situacao={item.situacao}
          aoPressionar={() => navigation.navigate('DetalheServico', { id: item.o.solicitacaoId })}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={orcamentos.isRefetching}
          onRefresh={() => {
            void orcamentos.refetch();
            void contratacoes.refetch();
          }}
          tintColor={cores.primaria}
        />
      }
      ListEmptyComponent={
        <EstadoVazio
          icone="document-text-outline"
          titulo={filtro === 'todos' ? 'Nenhum orçamento enviado' : 'Nada por aqui'}
          texto={
            filtro === 'todos'
              ? 'Os pedidos que você orçar aparecem aqui para acompanhar a negociação.'
              : 'Nenhum orçamento nesta situação.'
          }
        />
      }
    />
  );
}

function CartaoOrcamento({
  orcamento: o,
  contratacao,
  situacao,
  aoPressionar,
}: {
  orcamento: Orcamento;
  contratacao?: Contratacao;
  situacao: SituacaoPrestador;
  aoPressionar: () => void;
}) {
  // o prestador só lê o pedido enquanto ele está aberto ou depois de ser contratado
  const pedido = useQuery({
    queryKey: ['solicitacoes', o.solicitacaoId],
    queryFn: () => buscarSolicitacao(o.solicitacaoId),
    retry: false,
  });
  const selo = seloDoPrestador[situacao];
  const pendente = o.propostaPendente;

  let passo = 'Aguardando o cliente escolher. Você será avisado.';
  if (situacao === 'suaVez' && pendente)
    passo = `O cliente propôs ${formatarMoeda(pendente.valor)}. Toque para responder.`;
  else if (situacao === 'negociacao' && pendente)
    passo = `Você propôs ${formatarMoeda(pendente.valor)}. Aguardando o cliente.`;
  else if (situacao === 'contratado' && contratacao)
    passo = `Agendado para ${formatarDataHora(contratacao.dataAgendada)}.`;
  else if (situacao === 'execucao') passo = 'Serviço em andamento. Conclua quando terminar.';
  else if (situacao === 'concluido') passo = 'Serviço concluído.';
  else if (situacao === 'outroContratado') passo = 'O cliente escolheu outro prestador desta vez.';
  else if (situacao === 'recusado') passo = 'O cliente recusou este orçamento.';

  const destaque = situacao === 'suaVez' || situacao === 'contratado';

  return (
    <Cartao
      aoPressionar={aoPressionar}
      estilo={
        situacao === 'outroContratado' || situacao === 'recusado' ? estilos.apagado : undefined
      }
    >
      <View style={estilos.linha}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {pedido.data
            ? `${pedido.data.categoria.nome} · ${pedido.data.bairro}`
            : `Pedido #${o.solicitacaoId}`}
        </Text>
        <Selo texto={selo.texto} tom={selo.tom} />
      </View>
      {pedido.data && (
        <Text style={estilos.descricao} numberOfLines={2}>
          {pedido.data.descricao}
        </Text>
      )}
      <View style={estilos.linha}>
        <Text style={estilos.valor}>{formatarMoeda(contratacao?.valorAcordado ?? o.valor)}</Text>
        <Text style={estilos.meta}>Enviado {formatarQuando(o.criadoEm).toLowerCase()}</Text>
      </View>
      {o.valor !== o.valorInicial && (
        <Text style={estilos.meta}>Valor inicial: {formatarMoeda(o.valorInicial)}</Text>
      )}
      <Text style={[estilos.passo, destaque && estilos.passoDestaque]}>{passo}</Text>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  alerta: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.alerta,
    backgroundColor: cores.alertaClaro,
    padding: espacos.md,
    borderRadius: 12,
    marginBottom: espacos.md,
  },
  apagado: { opacity: 0.6 },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacos.sm,
  },
  titulo: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
  },
  descricao: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginVertical: espacos.sm,
  },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.primariaEscura },
  meta: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  passo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.sm,
    paddingTop: espacos.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  passoDestaque: { fontFamily: fontes.seminegrito, color: cores.primariaEscura },
});
