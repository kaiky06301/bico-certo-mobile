import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Selo } from '../../components/Selo';
import { chaves, useEnderecos } from '../../hooks/consultas';
import { Endereco } from '../../models/usuario';
import { excluirEndereco, tornarPrincipal } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';

type Navegacao = { navigate: (rota: string, params?: object) => void };

/** Lista de endereços salvos: adicionar, editar, excluir e marcar o principal. */
export function MeusEnderecosScreen() {
  const navigation = useNavigation<Navegacao>();
  const queryClient = useQueryClient();
  const enderecos = useEnderecos();

  const atualizar = () => queryClient.invalidateQueries({ queryKey: chaves.enderecos });

  const principal = useMutation({
    mutationFn: tornarPrincipal,
    onSuccess: atualizar,
    onError: (erro) => Alert.alert('Não foi possível', mensagemDeErro(erro)),
  });
  const excluir = useMutation({
    mutationFn: excluirEndereco,
    onSuccess: atualizar,
    onError: (erro) => Alert.alert('Não foi possível excluir', mensagemDeErro(erro)),
  });

  function confirmarExclusao(endereco: Endereco) {
    Alert.alert(
      `Excluir "${endereco.apelido}"?`,
      endereco.principal
        ? 'Ele é o seu endereço principal: o próximo da lista passa a ser o principal.'
        : 'Pedidos já feitos nesse endereço não são afetados.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluir.mutate(endereco.id) },
      ],
    );
  }

  if (enderecos.isLoading) return <Carregando />;
  if (enderecos.isError) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(enderecos.error)}
        aoTentarDeNovo={() => void enderecos.refetch()}
      />
    );
  }

  const lista = enderecos.data ?? [];

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={enderecos.isRefetching}
          onRefresh={() => void enderecos.refetch()}
          tintColor={cores.primaria}
        />
      }
    >
      {lista.length === 0 && (
        <EstadoVazio
          icone="location-outline"
          titulo="Nenhum endereço salvo"
          texto="Salve sua casa, a casa da família ou o trabalho para pedir serviços com um toque."
        />
      )}

      {lista.map((endereco) => (
        <Cartao key={endereco.id}>
          <View style={estilos.linha}>
            <Ionicons
              name={endereco.principal ? 'home-outline' : 'location-outline'}
              size={22}
              color={cores.secundaria}
            />
            <View style={estilos.textos}>
              <Text style={estilos.apelido}>{endereco.apelido}</Text>
              <Text style={estilos.detalhe}>
                {endereco.logradouro}
                {endereco.complemento ? ` - ${endereco.complemento}` : ''}
              </Text>
              <Text style={estilos.detalhe}>
                {endereco.bairro} · {endereco.cidade}/{endereco.uf}
              </Text>
              {endereco.principal && <Selo texto="Principal" tom="sucesso" />}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${endereco.apelido}`}
              hitSlop={12}
              onPress={() => navigation.navigate('EnderecoForm', { id: endereco.id })}
            >
              <Ionicons name="create-outline" size={22} color={cores.secundaria} />
            </Pressable>
          </View>
          <View style={estilos.acoes}>
            {!endereco.principal && (
              <Text
                accessibilityRole="button"
                style={estilos.acao}
                onPress={() => principal.mutate(endereco.id)}
              >
                Tornar principal
              </Text>
            )}
            <Text
              accessibilityRole="button"
              style={[estilos.acao, estilos.acaoPerigo]}
              onPress={() => confirmarExclusao(endereco)}
            >
              Excluir
            </Text>
          </View>
        </Cartao>
      ))}

      <Botao
        titulo="+ Adicionar endereço"
        variante="contorno"
        estilo={estilos.adicionar}
        aoPressionar={() => navigation.navigate('EnderecoForm', {})}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, gap: espacos.sm, paddingBottom: espacos.xl * 2 },
  linha: { flexDirection: 'row', gap: espacos.md, alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2, alignItems: 'flex-start' },
  apelido: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  detalhe: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espacos.lg,
    marginTop: espacos.sm,
  },
  acao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.secundaria,
    paddingVertical: espacos.xs,
  },
  acaoPerigo: { color: cores.perigo },
  adicionar: { marginTop: espacos.sm },
});
