import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { CartaoAvaliacao } from '../../components/CartaoAvaliacao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { useMinhasAvaliacoes } from '../../hooks/consultas';
import { cores } from '../../theme/cores';
import { espacos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';

/** Histórico das avaliações que o cliente fez dos prestadores. */
export function MinhasAvaliacoesScreen() {
  const avaliacoes = useMinhasAvaliacoes();

  if (avaliacoes.isLoading) return <Carregando />;
  if (avaliacoes.isError) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(avaliacoes.error)}
        aoTentarDeNovo={() => void avaliacoes.refetch()}
      />
    );
  }

  return (
    <FlatList
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      data={avaliacoes.data?.conteudo ?? []}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <CartaoAvaliacao avaliacao={item} titulo={`${item.prestador} · ${item.servico}`} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={avaliacoes.isRefetching}
          onRefresh={() => void avaliacoes.refetch()}
          tintColor={cores.primaria}
        />
      }
      ListEmptyComponent={
        <EstadoVazio
          icone="star-outline"
          titulo="Nenhuma avaliação ainda"
          texto="Quando um serviço for concluído, avalie o prestador no detalhe do pedido."
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, gap: espacos.sm, flexGrow: 1 },
});
