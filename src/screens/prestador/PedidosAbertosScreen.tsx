import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CartaoPedido } from '../../components/CartaoPedido';
import { Carregando, EstadoVazio, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import { useAuth } from '../../contexts/AuthContext';
import { useOrcamentos, useSolicitacoesAbertas } from '../../hooks/consultas';
import { Urgencia } from '../../models/solicitacao';
import { PrestadorAbasParams, PrestadorStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { distanciaKm, textoDistancia } from '../../utils/distancia';
import { mensagemDeErro } from '../../utils/erros';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PrestadorAbasParams, 'PedidosAbertos'>,
  NativeStackScreenProps<PrestadorStackParams>
>;

type FiltroUrgencia = 'TODAS' | Urgencia;
type Ordem = 'recentes' | 'proximos' | 'urgentes';

const pesoUrgencia: Record<Urgencia, number> = { ALTA: 3, MEDIA: 2, BAIXA: 1 };
const UM_DIA = 24 * 60 * 60 * 1000;

/**
 * Oportunidades: pedidos abertos da categoria do prestador que ele AINDA NÃO orçou.
 * Os que ele já orçou vão para a aba "Orçamentos". A lista se atualiza sozinha a cada 30 s.
 */
export function PedidosAbertosScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const { data, isLoading, isError, error, refetch, isRefetching } = useSolicitacoesAbertas();
  const meusOrcamentos = useOrcamentos();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [urgencia, setUrgencia] = useState<FiltroUrgencia>('TODAS');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  // momento em que a tela abriu: usado para marcar como "Novo pedido" o que chegou nas últimas 24 h
  const [agora] = useState(() => Date.now());

  if (isLoading) return <Carregando texto="Buscando pedidos da sua área..." />;
  if (isError)
    return <MensagemErro mensagem={mensagemDeErro(error)} aoTentarDeNovo={() => void refetch()} />;

  const jaOrcados = new Set((meusOrcamentos.data?.conteudo ?? []).map((o) => o.solicitacaoId));
  const oportunidades = (data?.conteudo ?? [])
    .filter((p) => !jaOrcados.has(p.id))
    .map((p) => ({ pedido: p, km: distanciaKm(usuario?.bairro, p.bairro) }))
    .filter((i) => urgencia === 'TODAS' || i.pedido.urgencia === urgencia)
    .sort((a, b) => {
      if (ordem === 'proximos') return (a.km ?? 999) - (b.km ?? 999);
      if (ordem === 'urgentes')
        return pesoUrgencia[b.pedido.urgencia] - pesoUrgencia[a.pedido.urgencia];
      return b.pedido.criadaEm.localeCompare(a.pedido.criadaEm);
    });
  const filtrando = urgencia !== 'TODAS' || ordem !== 'recentes';
  const rotuloOrdem = {
    recentes: 'mais recentes',
    proximos: 'mais próximos',
    urgentes: 'mais urgentes',
  };

  return (
    <>
      <FlatList
        style={estilos.lista}
        contentContainerStyle={estilos.conteudo}
        data={oportunidades}
        keyExtractor={(i) => String(i.pedido.id)}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <View style={estilos.cabecalhoTextos}>
              <Text style={estilos.ola}>Olá, {usuario?.nome.split(' ')[0]}!</Text>
              <Text style={estilos.resumo}>
                {oportunidades.length === 1
                  ? '1 oportunidade na sua área'
                  : `${oportunidades.length} oportunidades na sua área`}
                {` · ${rotuloOrdem[ordem]}`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar e ordenar pedidos"
              onPress={() => setFiltrosAbertos(true)}
              style={[estilos.botaoFiltro, filtrando && estilos.botaoFiltroAtivo]}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={filtrando ? cores.branco : cores.secundaria}
              />
              <Text style={[estilos.textoFiltro, filtrando && { color: cores.branco }]}>
                Filtros
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const p = item.pedido;
          const novo = agora - new Date(p.criadaEm).getTime() < UM_DIA;
          const fotos = p.quantidadeFotos ?? 0;
          return (
            <CartaoPedido
              pedido={p}
              situacao={
                novo
                  ? { texto: 'Novo pedido', tom: 'sucesso' }
                  : { texto: 'Aguardando orçamento', tom: 'primario' }
              }
              detalhes={[
                { icone: 'navigate-outline', texto: textoDistancia(item.km) },
                ...(fotos > 0
                  ? [
                      {
                        icone: 'camera-outline' as const,
                        texto: fotos === 1 ? '1 foto' : `${fotos} fotos`,
                      },
                    ]
                  : []),
              ]}
              proximoPasso={{
                texto: 'Ver pedido e enviar orçamento',
                icone: 'paper-plane-outline',
                destaque: true,
              }}
              aoPressionar={() => navigation.navigate('DetalheServico', { id: p.id })}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void meusOrcamentos.refetch();
            }}
            tintColor={cores.primaria}
          />
        }
        ListEmptyComponent={
          filtrando ? (
            <EstadoVazio
              icone="filter-outline"
              titulo="Nenhum pedido com esse filtro"
              texto="Mude os filtros para ver as outras oportunidades."
            />
          ) : (
            <EstadoVazio
              icone="notifications-outline"
              titulo="Nenhuma oportunidade agora"
              texto="Quando um morador pedir um serviço da sua área, você recebe um aviso e ele aparece aqui. Os pedidos que você já orçou ficam na aba Orçamentos."
            />
          )
        }
      />

      <Modal
        visible={filtrosAbertos}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltrosAbertos(false)}
      >
        <View style={estilos.fundoModal}>
          <View style={estilos.folha}>
            <Text style={estilos.tituloModal}>Filtrar oportunidades</Text>
            <Text style={estilos.rotulo}>Urgência</Text>
            <Opcoes<FiltroUrgencia>
              opcoes={[
                { valor: 'TODAS', rotulo: 'Todas' },
                { valor: 'ALTA', rotulo: 'Alta' },
                { valor: 'MEDIA', rotulo: 'Média' },
                { valor: 'BAIXA', rotulo: 'Baixa' },
              ]}
              selecionado={urgencia}
              aoSelecionar={setUrgencia}
            />
            <Text style={estilos.rotulo}>Ordenar por</Text>
            <Opcoes<Ordem>
              opcoes={[
                { valor: 'recentes', rotulo: 'Mais recentes' },
                { valor: 'proximos', rotulo: 'Mais próximos' },
                { valor: 'urgentes', rotulo: 'Mais urgentes' },
              ]}
              selecionado={ordem}
              aoSelecionar={setOrdem}
            />
            <Text style={estilos.nota}>
              Você vê só os pedidos da sua categoria de serviço. Para atender outro tipo de serviço,
              mude em Perfil → Perfil profissional.
            </Text>
            <Botao titulo="Ver resultados" aoPressionar={() => setFiltrosAbertos(false)} />
            {filtrando && (
              <Botao
                titulo="Limpar filtros"
                variante="contorno"
                estilo={estilos.limpar}
                aoPressionar={() => {
                  setUrgencia('TODAS');
                  setOrdem('recentes');
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, flexGrow: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    marginBottom: espacos.md,
  },
  cabecalhoTextos: { flex: 1 },
  ola: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  resumo: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  botaoFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: espacos.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.secundaria,
  },
  botaoFiltroAtivo: { backgroundColor: cores.secundaria },
  textoFiltro: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.secundaria },
  fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: raio.grande,
    borderTopRightRadius: raio.grande,
    padding: espacos.lg,
    paddingBottom: espacos.xl * 1.5,
  },
  tituloModal: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.texto,
    marginBottom: espacos.md,
  },
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  nota: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginBottom: espacos.md,
  },
  limpar: { marginTop: espacos.sm },
});
