import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { CartaoPedido } from '../../components/CartaoPedido';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { useAuth } from '../../contexts/AuthContext';
import { useSolicitacoesAbertas } from '../../hooks/consultas';
import { PrestadorAbasParams, PrestadorStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PrestadorAbasParams, 'PedidosAbertos'>,
  NativeStackScreenProps<PrestadorStackParams>
>;

export function PedidosAbertosScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const { data, isLoading, isError, error, refetch, isRefetching } = useSolicitacoesAbertas();

  if (isLoading) return <Carregando texto="Buscando pedidos da sua area..." />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={data?.conteudo ?? []}
      keyExtractor={(pedido) => String(pedido.id)}
      ListHeaderComponent={
        <Text style={estilos.cabecalho}>
          Ola, {usuario?.nome.split(' ')[0]}! Estes pedidos sao da sua area e estao esperando
          orcamento.
        </Text>
      }
      renderItem={({ item }) => (
        <CartaoPedido
          pedido={item}
          aoPressionar={() => navigation.navigate('DetalheServico', { id: item.id })}
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
          icone="notifications-outline"
          titulo="Nenhum pedido aberto agora"
          texto="Quando um morador pedir um servico da sua area, voce recebe um aviso e ele aparece aqui."
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  cabecalho: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.md,
  },
});
