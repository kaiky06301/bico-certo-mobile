import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Cartao } from '../../components/Cartao';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import { Selo } from '../../components/Selo';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useNotificacoes } from '../../hooks/consultas';
import { Notificacao, TipoAviso } from '../../models/solicitacao';
import {
  excluirNotificacao,
  limparLidas,
  marcarComoLida,
  marcarTodasComoLidas,
} from '../../services/notificacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarMoeda, formatarQuando } from '../../utils/formatacao';

type Filtro = 'todas' | 'naoLidas' | 'lidas';

/** Ícone, cor e chamada para ação de cada tipo de aviso. */
const visualDoTipo: Record<
  TipoAviso,
  { icone: keyof typeof Ionicons.glyphMap; cor: string; fundo: string; acao: string }
> = {
  PEDIDO: {
    icone: 'megaphone-outline',
    cor: cores.primaria,
    fundo: cores.primariaClara,
    acao: 'Ver pedido',
  },
  ORCAMENTO: {
    icone: 'document-text-outline',
    cor: cores.sucesso,
    fundo: cores.sucessoClaro,
    acao: 'Ver orçamento',
  },
  NEGOCIACAO: {
    icone: 'swap-horizontal',
    cor: cores.alerta,
    fundo: cores.alertaClaro,
    acao: 'Responder',
  },
  CONTRATACAO: {
    icone: 'briefcase-outline',
    cor: cores.secundaria,
    fundo: cores.secundariaClara,
    acao: 'Ver contratação',
  },
  AGENDAMENTO: {
    icone: 'calendar-outline',
    cor: cores.secundaria,
    fundo: cores.secundariaClara,
    acao: 'Ver agenda',
  },
  SERVICO: {
    icone: 'construct-outline',
    cor: cores.alerta,
    fundo: cores.alertaClaro,
    acao: 'Acompanhar',
  },
  CONCLUSAO: {
    icone: 'checkmark-done-outline',
    cor: cores.sucesso,
    fundo: cores.sucessoClaro,
    acao: 'Avaliar',
  },
  CANCELAMENTO: {
    icone: 'close-circle-outline',
    cor: cores.perigo,
    fundo: cores.perigoClaro,
    acao: 'Ver detalhes',
  },
};

/**
 * Central de avisos: o que aconteceu em cada pedido (gerado pela API Java e pelo módulo .NET).
 * Tocar abre o pedido ou a proposta; segurar exclui; o menu ⋯ marca todas como lidas ou limpa as lidas.
 */
export function AvisosScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<{
    navigate: (rota: string, params: object) => void;
    setOptions: (opcoes: object) => void;
  }>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificacoes();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [menuAberto, setMenuAberto] = useState(false);

  function atualizar() {
    queryClient.invalidateQueries({ queryKey: chaves.notificacoes });
  }

  const lida = useMutation({ mutationFn: marcarComoLida, onSuccess: atualizar });
  const todasLidas = useMutation({ mutationFn: marcarTodasComoLidas, onSuccess: atualizar });
  const excluir = useMutation({ mutationFn: excluirNotificacao, onSuccess: atualizar });
  const limpar = useMutation({
    mutationFn: limparLidas,
    onSuccess: atualizar,
    onError: (e) => Alert.alert('Não foi possível limpar', mensagemDeErro(e)),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mais opções dos avisos"
          hitSlop={10}
          onPress={() => setMenuAberto(true)}
          style={estilos.botaoMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={cores.texto} />
        </Pressable>
      ),
    });
  }, [navigation]);

  function abrir(aviso: Notificacao) {
    if (!aviso.lida) lida.mutate(aviso.id);
    if (usuario?.papel === 'PRESTADOR') {
      navigation.navigate('DetalheServico', { id: aviso.solicitacaoId });
    } else if (aviso.orcamentoId && (aviso.tipo === 'ORCAMENTO' || aviso.tipo === 'NEGOCIACAO')) {
      navigation.navigate('PropostaOrcamento', {
        solicitacaoId: aviso.solicitacaoId,
        orcamentoId: aviso.orcamentoId,
      });
    } else {
      navigation.navigate('DetalhePedido', { id: aviso.solicitacaoId });
    }
  }

  function confirmarExclusao(aviso: Notificacao) {
    Alert.alert('Excluir aviso?', aviso.mensagem, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluir.mutate(aviso.id) },
    ]);
  }

  function confirmarLimpeza() {
    setMenuAberto(false);
    Alert.alert(
      'Limpar avisos lidos?',
      'Os avisos já lidos são apagados. Os não lidos continuam.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => limpar.mutate() },
      ],
    );
  }

  if (isLoading) return <Carregando />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  const todos = data?.conteudo ?? [];
  const naoLidos = todos.filter((a) => !a.lida).length;
  const visiveis = todos.filter((a) =>
    filtro === 'todas' ? true : filtro === 'naoLidas' ? !a.lida : a.lida,
  );

  return (
    <>
      <FlatList
        style={estilos.lista}
        contentContainerStyle={estilos.conteudo}
        data={visiveis}
        keyExtractor={(aviso) => String(aviso.id)}
        ListHeaderComponent={
          <Opcoes<Filtro>
            opcoes={[
              { valor: 'todas', rotulo: 'Todas' },
              { valor: 'naoLidas', rotulo: `Não lidas${naoLidos ? ` (${naoLidos})` : ''}` },
              { valor: 'lidas', rotulo: 'Lidas' },
            ]}
            selecionado={filtro}
            aoSelecionar={setFiltro}
          />
        }
        renderItem={({ item }) => {
          const visual = visualDoTipo[item.tipo] ?? visualDoTipo.PEDIDO;
          return (
            <Pressable
              onPress={() => abrir(item)}
              onLongPress={() => confirmarExclusao(item)}
              accessibilityRole="button"
              accessibilityHint="Toque para abrir. Segure para excluir."
              accessibilityLabel={`${item.lida ? '' : 'Não lido. '}${item.titulo}. ${item.mensagem}`}
            >
              <Cartao estilo={item.lida ? estilos.lida : estilos.naoLida}>
                <View style={estilos.cabecalho}>
                  <View style={[estilos.icone, { backgroundColor: visual.fundo }]}>
                    <Ionicons name={visual.icone} size={18} color={visual.cor} />
                  </View>
                  <Text style={estilos.titulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  {!item.lida && <Selo texto="Novo" tom="primario" />}
                </View>
                <Text style={[estilos.mensagem, !item.lida && estilos.mensagemNova]}>
                  {item.mensagem}
                </Text>
                <Text style={estilos.meta}>
                  Pedido #{item.solicitacaoId} · {formatarQuando(item.criadaEm)}
                </Text>
                <View style={estilos.rodape}>
                  <Text style={estilos.valor}>
                    {item.valor != null ? formatarMoeda(item.valor) : ''}
                  </Text>
                  <View style={estilos.acao}>
                    <Text style={[estilos.acaoTexto, { color: visual.cor }]}>
                      {usuario?.papel === 'PRESTADOR' && item.tipo === 'PEDIDO'
                        ? 'Enviar orçamento'
                        : visual.acao}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={visual.cor} />
                  </View>
                </View>
              </Cartao>
            </Pressable>
          );
        }}
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
            titulo={filtro === 'naoLidas' ? 'Tudo em dia' : 'Sem avisos'}
            texto={
              filtro === 'naoLidas'
                ? 'Você já leu todos os avisos.'
                : 'Novidades dos seus pedidos aparecem aqui.'
            }
          />
        }
      />

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <Pressable style={estilos.fundoMenu} onPress={() => setMenuAberto(false)}>
          <View style={estilos.menu}>
            <ItemMenu
              icone="checkmark-done-outline"
              texto="Marcar todas como lidas"
              desabilitado={naoLidos === 0}
              aoPressionar={() => {
                setMenuAberto(false);
                todasLidas.mutate();
              }}
            />
            <ItemMenu
              icone="trash-outline"
              texto="Limpar avisos lidos"
              perigo
              desabilitado={todos.length === naoLidos}
              aoPressionar={confirmarLimpeza}
            />
            <Text style={estilos.dica}>Dica: segure um aviso para excluí-lo.</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function ItemMenu(props: {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  aoPressionar: () => void;
  desabilitado?: boolean;
  perigo?: boolean;
}) {
  const cor = props.perigo ? cores.perigo : cores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={props.desabilitado}
      onPress={props.aoPressionar}
      style={({ pressed }) => [
        estilos.itemMenu,
        pressed && { opacity: 0.6 },
        props.desabilitado && { opacity: 0.35 },
      ]}
    >
      <Ionicons name={props.icone} size={20} color={cor} />
      <Text style={[estilos.itemMenuTexto, { color: cor }]}>{props.texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  botaoMenu: { paddingHorizontal: espacos.md, minHeight: 44, justifyContent: 'center' },
  naoLida: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  lida: { backgroundColor: cores.superficie },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.texto,
  },
  mensagem: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginTop: espacos.sm,
  },
  mensagemNova: { fontFamily: fontes.media },
  meta: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espacos.sm,
    paddingTop: espacos.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.medio, color: cores.texto },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  acaoTexto: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal },
  fundoMenu: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'flex-end' },
  menu: {
    marginTop: 100,
    marginRight: espacos.md,
    backgroundColor: cores.superficie,
    borderRadius: raio.medio,
    paddingVertical: espacos.xs,
    minWidth: 250,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    paddingHorizontal: espacos.md,
    minHeight: 48,
  },
  itemMenuTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal },
  dica: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    paddingHorizontal: espacos.md,
    paddingVertical: espacos.sm,
  },
});
