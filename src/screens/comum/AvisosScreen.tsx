import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useNotificacoes } from '../../hooks/consultas';
import { Notificacao } from '../../models/solicitacao';
import { marcarComoLida } from '../../services/notificacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora } from '../../utils/formatacao';

/** Avisos gerados de forma assincrona pela API Java (consumidor do RabbitMQ). */
export function AvisosScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<{ navigate: (rota: string, params: object) => void }>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificacoes();

  const lida = useMutation({
    mutationFn: marcarComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chaves.notificacoes });
    },
  });

  function abrir(aviso: Notificacao) {
    if (!aviso.lida) lida.mutate(aviso.id);
    const rota = usuario?.papel === 'PRESTADOR' ? 'DetalheServico' : 'DetalhePedido';
    navigation.navigate(rota, { id: aviso.solicitacaoId });
  }

  if (isLoading) return <Carregando />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={data?.conteudo ?? []}
      keyExtractor={(aviso) => String(aviso.id)}
      renderItem={({ item }) => (
        <Cartao aoPressionar={() => abrir(item)} estilo={item.lida ? undefined : estilos.naoLida}>
          <View style={estilos.linha}>
            <Ionicons
              name={item.lida ? 'mail-open-outline' : 'mail-unread-outline'}
              size={22}
              color={item.lida ? cores.textoSuave : cores.primaria}
            />
            <View style={estilos.texto}>
              <Text style={[estilos.mensagem, !item.lida && estilos.mensagemNova]}>
                {item.mensagem}
              </Text>
              <Text style={estilos.data}>{formatarDataHora(item.criadaEm)}</Text>
            </View>
          </View>
        </Cartao>
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
          icone="notifications-off-outline"
          titulo="Sem avisos"
          texto="Novidades dos seus pedidos aparecem aqui."
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  naoLida: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  linha: { flexDirection: 'row', gap: espacos.sm },
  texto: { flex: 1 },
  mensagem: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.texto },
  mensagemNova: { fontFamily: fontes.media },
  data: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
});
