import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { CartaoPedido } from '../../components/CartaoPedido';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { useMinhasSolicitacoes } from '../../hooks/consultas';
import { ClienteAbasParams, ClienteStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClienteAbasParams, 'MeusPedidos'>,
  NativeStackScreenProps<ClienteStackParams>
>;

export function MeusPedidosScreen({ navigation }: Props) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useMinhasSolicitacoes();

  if (isLoading) return <Carregando texto="Buscando seus pedidos..." />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={data?.conteudo ?? []}
      keyExtractor={(pedido) => String(pedido.id)}
      renderItem={({ item }) => (
        <CartaoPedido
          pedido={item}
          aoPressionar={() => navigation.navigate('DetalhePedido', { id: item.id })}
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
          icone="construct-outline"
          titulo="Nenhum pedido ainda"
          texto="Descreva um problema na aba Novo pedido e receba orcamentos de prestadores do seu bairro."
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
});
