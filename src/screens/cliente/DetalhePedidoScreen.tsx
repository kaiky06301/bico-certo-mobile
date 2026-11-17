import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { Carregando, MensagemErro } from '../../components/Estados';
import { Estrelas } from '../../components/Estrelas';
import { GaleriaFotos } from '../../components/GaleriaFotos';
import { HistoricoPedido } from '../../components/HistoricoPedido';
import { ModalCancelamento } from '../../components/ModalCancelamento';
import { OrcamentosRecebidos } from '../../components/OrcamentosRecebidos';
import { ResumoPrestador } from '../../components/ResumoPrestador';
import { Selo } from '../../components/Selo';
import { seloContratacao } from '../../components/selos';
import {
  chaves,
  useContratacoes,
  useMinhasAvaliacoes,
  useOrcamentos,
  useSolicitacao,
} from '../../hooks/consultas';
import { ClienteStackParams } from '../../navigation/tipos';
import { alterarStatusContratacao } from '../../services/orcamentoService';
import { avaliarSolicitacao, cancelarSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora, formatarMoeda } from '../../utils/formatacao';
import { contratacaoDoPedido, etapaDoPedido, seloDaEtapa } from '../../utils/situacaoPedido';

type Props = NativeStackScreenProps<ClienteStackParams, 'DetalhePedido'>;

/**
 * Detalhe do pedido do cliente. A estrutura é a mesma; o conteúdo muda com a etapa:
 * orçamentos (comparar e negociar) → contratado/em execução (prestador, valor, agenda, contato)
 * → concluído (valor pago e avaliação) ou cancelado (motivo). O histórico fica sempre no fim.
 */
export function DetalhePedidoScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const pedido = useSolicitacao(id);
  const orcamentos = useOrcamentos(id);
  const contratacoes = useContratacoes();
  const minhasAvaliacoes = useMinhasAvaliacoes();

  const [cancelando, setCancelando] = useState(false);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const contratacao = contratacaoDoPedido(id, contratacoes.data?.conteudo);
  const avaliacao = minhasAvaliacoes.data?.conteudo.find((a) => a.solicitacaoId === id);

  function atualizarTudo() {
    queryClient.invalidateQueries({ queryKey: chaves.solicitacao(id) });
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    queryClient.invalidateQueries({ queryKey: chaves.contratacoes });
    queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
  }

  const cancelar = useMutation({
    mutationFn: async (motivo: string) => {
      if (contratacao && contratacao.status !== 'Concluida') {
        await alterarStatusContratacao(contratacao.id, 'Cancelada');
      }
      await cancelarSolicitacao(id, motivo);
    },
    onSuccess: () => {
      setCancelando(false);
      atualizarTudo();
    },
    onError: (erro) => Alert.alert('Não foi possível cancelar', mensagemDeErro(erro)),
  });

  const avaliar = useMutation({
    mutationFn: () => avaliarSolicitacao(id, nota, comentario.trim() || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.minhasAvaliacoes }),
  });

  if (pedido.isLoading) return <Carregando />;
  if (pedido.isError || !pedido.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(pedido.error)}
        aoTentarDeNovo={() => void pedido.refetch()}
      />
    );
  }

  const p = pedido.data;
  const listaOrcamentos = orcamentos.data?.conteudo ?? [];
  const pendentes = listaOrcamentos.filter((o) => o.status === 'Pendente').length;
  const etapa = etapaDoPedido(p, contratacao);
  const selo = seloDaEtapa(etapa, pendentes);
  const orcamentoAceito = listaOrcamentos.find((o) => o.id === contratacao?.orcamentoId);
  const nomePrestador = orcamentoAceito?.prestadorNome ?? p.prestador?.nome;
  const usuarioPrestador = contratacao?.prestadorId;
  const contratado = etapa === 'contratado' || etapa === 'execucao' || etapa === 'concluido';

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={pedido.isRefetching}
          onRefresh={atualizarTudo}
          tintColor={cores.primaria}
        />
      }
    >
      {/* ---------- o pedido ---------- */}
      <View style={estilos.topo}>
        <Text style={estilos.numero}>Pedido #{p.id}</Text>
        <Selo texto={selo.texto} tom={selo.tom} />
      </View>
      <Text style={estilos.descricao}>{p.descricao}</Text>
      {!!p.observacao && (
        <Text style={estilos.infoAdicional}>
          <Text style={estilos.observacaoRotulo}>Informação adicional: </Text>
          {p.observacao}
        </Text>
      )}
      <GaleriaFotos solicitacaoId={p.id} quantidade={p.quantidadeFotos ?? 0} />

      <View style={estilos.local}>
        <Ionicons name="location-outline" size={16} color={cores.textoSuave} />
        <Text style={estilos.meta}>
          {contratado && p.endereco ? p.endereco : p.bairro} · aberto em{' '}
          {formatarDataHora(p.criadaEm)}
        </Text>
      </View>
      {!contratado && etapa !== 'cancelado' && (
        <Text style={estilos.privacidade}>
          Por enquanto os prestadores veem só o bairro. A rua e o número são liberados para quem
          você contratar.
        </Text>
      )}

      <CartaoTriagem
        categoria={p.categoria.nome}
        urgencia={p.urgencia}
        precoMinimo={p.precoMinimo}
        precoMaximo={p.precoMaximo}
        resumo={p.resumoTriagem}
        dicaSeguranca={p.dicaSeguranca}
        origem={p.origemTriagem}
      />

      {/* ---------- etapa: orçamentos ---------- */}
      {etapa === 'orcamentos' && (
        <OrcamentosRecebidos
          orcamentos={listaOrcamentos}
          carregando={orcamentos.isLoading}
          aoVerProposta={(o) =>
            navigation.navigate('PropostaOrcamento', { solicitacaoId: id, orcamentoId: o.id })
          }
        />
      )}

      {/* ---------- etapa: contratado / em execução / concluído ---------- */}
      {contratado && nomePrestador && (
        <Cartao estilo={estilos.bloco}>
          <View style={estilos.linha}>
            <Text style={estilos.tituloBloco}>
              {etapa === 'concluido' ? 'Serviço realizado' : 'Prestador contratado'}
            </Text>
            {contratacao && (
              <Selo
                texto={seloContratacao[contratacao.status].texto}
                tom={seloContratacao[contratacao.status].tom}
              />
            )}
          </View>
          {usuarioPrestador ? (
            <ResumoPrestador usuarioId={usuarioPrestador} nome={nomePrestador} />
          ) : (
            <Text style={estilos.nomePrestador}>{nomePrestador}</Text>
          )}

          {contratacao && (
            <View style={estilos.dados}>
              <Dado
                icone="cash-outline"
                rotulo={etapa === 'concluido' ? 'Valor final pago' : 'Valor acordado'}
                valor={formatarMoeda(contratacao.valorAcordado)}
              />
              <Dado
                icone="calendar-outline"
                rotulo="Agendado para"
                valor={formatarDataHora(contratacao.dataAgendada)}
              />
            </View>
          )}
          {!!p.endereco && etapa !== 'concluido' && (
            <Dado icone="home-outline" rotulo="Endereço do serviço" valor={p.endereco} />
          )}
          {!!p.prestador?.telefone && etapa !== 'concluido' && (
            <Dado
              icone="call-outline"
              rotulo="Telefone do prestador"
              valor={p.prestador.telefone}
            />
          )}

          <View style={estilos.botoesContato}>
            {usuarioPrestador && (
              <Botao
                titulo="Ver perfil"
                variante="contorno"
                estilo={estilos.botaoMetade}
                aoPressionar={() =>
                  navigation.navigate('PerfilPrestador', { usuarioId: usuarioPrestador })
                }
              />
            )}
          </View>
          {etapa === 'contratado' && (
            <Text style={estilos.privacidade}>
              O prestador marca &quot;Iniciar serviço&quot; quando chegar ao local.
            </Text>
          )}
        </Cartao>
      )}

      {/* ---------- etapa: concluído → avaliação ---------- */}
      {etapa === 'concluido' && (
        <Cartao estilo={estilos.bloco}>
          {avaliacao ? (
            <>
              <Text style={estilos.tituloBloco}>Sua avaliação</Text>
              <Estrelas nota={avaliacao.nota} aoMudar={() => undefined} />
              {!!avaliacao.comentario && (
                <Text style={estilos.infoAdicional}>“{avaliacao.comentario}”</Text>
              )}
            </>
          ) : (
            <>
              <Text style={estilos.tituloBloco}>Avalie o prestador</Text>
              <Text style={estilos.privacidade}>
                Sua avaliação ajuda seus vizinhos a escolher bem.
              </Text>
              <Estrelas nota={nota} aoMudar={setNota} />
              <CampoTexto
                rotulo="Comentário (opcional)"
                multiline
                value={comentario}
                onChangeText={setComentario}
                maxLength={500}
              />
              {avaliar.isError && <Text style={estilos.erro}>{mensagemDeErro(avaliar.error)}</Text>}
              <Botao
                titulo="Enviar avaliação"
                carregando={avaliar.isPending}
                aoPressionar={() => avaliar.mutate()}
              />
            </>
          )}
        </Cartao>
      )}

      {/* ---------- etapa: cancelado ---------- */}
      {etapa === 'cancelado' && (
        <Cartao estilo={estilos.blocoCancelado}>
          <Text style={estilos.tituloBloco}>Pedido cancelado</Text>
          <Text style={estilos.meta}>Em {formatarDataHora(p.atualizadaEm)}</Text>
          <Text style={estilos.infoAdicional}>
            <Text style={estilos.observacaoRotulo}>Motivo: </Text>
            {p.motivoCancelamento ?? 'não informado'}
          </Text>
        </Cartao>
      )}

      <HistoricoPedido pedido={p} orcamentos={listaOrcamentos} contratacao={contratacao} />

      {/* ---------- ações conforme a etapa ---------- */}
      <View style={estilos.acoes}>
        {etapa === 'orcamentos' && (
          <Botao
            titulo="Editar pedido"
            variante="secundaria"
            aoPressionar={() => navigation.navigate('EditarPedido', { id })}
          />
        )}
        {(etapa === 'orcamentos' || etapa === 'contratado') && (
          <Botao
            titulo="Cancelar pedido"
            variante="perigo"
            aoPressionar={() => setCancelando(true)}
          />
        )}
      </View>

      <ModalCancelamento
        visivel={cancelando}
        carregando={cancelar.isPending}
        aoFechar={() => setCancelando(false)}
        aoConfirmar={(motivo) => cancelar.mutate(motivo)}
      />
    </ScrollView>
  );
}

function Dado({
  icone,
  rotulo,
  valor,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  valor: string;
}) {
  return (
    <View style={estilos.dado}>
      <Ionicons name={icone} size={20} color={cores.secundaria} />
      <View style={estilos.dadoTextos}>
        <Text style={estilos.dadoRotulo}>{rotulo}</Text>
        <Text selectable style={estilos.dadoValor}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.textoSuave },
  descricao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.medio,
    color: cores.texto,
    marginTop: espacos.sm,
  },
  infoAdicional: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginTop: espacos.sm,
  },
  observacaoRotulo: { fontFamily: fontes.seminegrito, color: cores.texto },
  local: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs, marginTop: espacos.md },
  meta: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    flexShrink: 1,
  },
  privacidade: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
    marginBottom: espacos.md,
  },
  bloco: { marginTop: espacos.md },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacos.md,
  },
  tituloBloco: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.texto,
    marginBottom: espacos.xs,
  },
  nomePrestador: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  dados: { marginTop: espacos.md },
  dado: { flexDirection: 'row', gap: espacos.sm, alignItems: 'flex-start', marginTop: espacos.sm },
  dadoTextos: { flex: 1 },
  dadoRotulo: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  dadoValor: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.texto },
  botoesContato: { flexDirection: 'row', gap: espacos.sm, marginTop: espacos.md },
  botaoMetade: { flex: 1 },
  blocoCancelado: {
    marginTop: espacos.md,
    backgroundColor: cores.secundariaClara,
    borderRadius: raio.medio,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  acoes: { gap: espacos.sm, marginTop: espacos.lg },
});
