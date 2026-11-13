import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Selo } from '../../components/Selo';
import { seloContratacao } from '../../components/selos';
import { useContratacoes } from '../../hooks/consultas';
import { PrestadorAbasParams, PrestadorStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora, formatarMoeda } from '../../utils/formatacao';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PrestadorAbasParams, 'Agenda'>,
  NativeStackScreenProps<PrestadorStackParams>
>;

/** Servicos contratados do prestador (API .NET), em ordem de data. */
export function AgendaScreen({ navigation }: Props) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useContratacoes();

  if (isLoading) return <Carregando texto="Carregando sua agenda..." />;
  if (isError) return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={data?.conteudo ?? []}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item }) => {
        const selo = seloContratacao[item.status];
        return (
          <Cartao aoPressionar={() => navigation.navigate('DetalheServico', { id: item.solicitacaoId })}>
            <View style={estilos.linha}>
              <View style={estilos.data}>
                <Ionicons name="calendar-outline" size={18} color={cores.secundaria} />
                <Text style={estilos.dataTexto}>{formatarDataHora(item.dataAgendada)}</Text>
              </View>
              <Selo texto={selo.texto} tom={selo.tom} />
            </View>
            <Text style={estilos.valor}>{formatarMoeda(item.valorAcordado)}</Text>
            <Text style={estilos.meta}>Pedido #{item.solicitacaoId}</Text>
          </Cartao>
        );
      }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={cores.primaria} />
      }
      ListEmptyComponent={
        <EstadoVazio
          icone="calendar-clear-outline"
          titulo="Agenda vazia"
          texto="Quando um cliente aceitar seu orcamento, o servico aparece aqui com a data combinada."
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  data: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  dataTexto: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.secundaria },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.primariaEscura, marginTop: espacos.sm },
  meta: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
