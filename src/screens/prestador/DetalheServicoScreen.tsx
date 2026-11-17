import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ComponentRef, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { distanciaKm, textoDistancia } from '../../utils/distancia';
import { seloDoPrestador, situacaoDoPrestador } from '../../utils/situacaoPrestador';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { GaleriaFotos } from '../../components/GaleriaFotos';
import { Carregando, MensagemErro } from '../../components/Estados';
import { Negociacao } from '../../components/Negociacao';
import { Selo } from '../../components/Selo';
import { seloContratacao, seloOrcamento, seloStatusPedido } from '../../components/selos';
import { Subtitulo, Titulo } from '../../components/Titulo';
import { chaves, useContratacoes, useOrcamentos, useSolicitacao } from '../../hooks/consultas';
import { PrestadorStackParams } from '../../navigation/tipos';
import { alterarStatusContratacao, enviarOrcamento } from '../../services/orcamentoService';
import { assumirSolicitacao, concluirSolicitacao } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import {
  formatarDataHora,
  formatarFaixa,
  formatarMoeda,
  formatarQuando,
  gerarChaveUnica,
} from '../../utils/formatacao';
import { esquemaOrcamento, exigirJustificativa, validar } from '../../validation/esquemas';

type Props = NativeStackScreenProps<PrestadorStackParams, 'DetalheServico'>;

/**
 * Jornada do prestador em um pedido:
 * enviar orcamento (API .NET) -> cliente aceita -> iniciar (Java: assumir + .NET: EmAndamento)
 * -> concluir (Java: concluir + .NET: Concluida).
 */
export function DetalheServicoScreen({ route }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const pedido = useSolicitacao(id);
  const orcamentos = useOrcamentos(id);
  const contratacoes = useContratacoes();

  const [valor, setValor] = useState('');
  const [prazo, setPrazo] = useState('1');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const chaveOrcamento = useRef(gerarChaveUnica());
  const { usuario } = useAuth();
  const rolagem = useRef<ComponentRef<typeof ScrollView>>(null);
  const posicaoFormulario = useRef(0);

  const meuOrcamento = orcamentos.data?.conteudo[0];
  const contratacao = contratacoes.data?.conteudo.find(
    (c) => c.solicitacaoId === id && c.status !== 'Cancelada',
  );

  function atualizarTudo() {
    queryClient.invalidateQueries({ queryKey: chaves.solicitacao(id) });
    queryClient.invalidateQueries({ queryKey: chaves.orcamentos(id) });
    queryClient.invalidateQueries({ queryKey: chaves.contratacoes });
    queryClient.invalidateQueries({ queryKey: chaves.abertas });
  }

  const enviar = useMutation({
    mutationFn: () =>
      enviarOrcamento(
        {
          solicitacaoId: id,
          valor: Number(valor.replace(',', '.')),
          prazoDias: Number(prazo),
          observacao: observacao.trim() || undefined,
        },
        chaveOrcamento.current,
      ),
    onSuccess: () => {
      chaveOrcamento.current = gerarChaveUnica();
      atualizarTudo();
    },
  });

  const iniciar = useMutation({
    mutationFn: async () => {
      if (pedido.data?.status === 'ABERTA') await assumirSolicitacao(id);
      await alterarStatusContratacao(contratacao!.id, 'EmAndamento');
    },
    onSuccess: atualizarTudo,
  });

  const concluir = useMutation({
    mutationFn: async () => {
      if (pedido.data?.status === 'EM_ATENDIMENTO') await concluirSolicitacao(id);
      await alterarStatusContratacao(contratacao!.id, 'Concluida');
    },
    onSuccess: atualizarTudo,
  });

  async function aoEnviar() {
    const dados = { valor: Number(valor.replace(',', '.')), prazoDias: Number(prazo) };
    const encontrados = await validar(esquemaOrcamento, dados);
    const semMotivo = exigirJustificativa(dados.valor, pedido.data?.precoMaximo, observacao);
    if (semMotivo) encontrados.observacao = semMotivo;
    setErros(encontrados);
    if (!Object.keys(encontrados).length) enviar.mutate();
  }

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
  const situacao = situacaoDoPrestador(meuOrcamento, contratacao);
  const status = p.status === 'CANCELADA' ? seloStatusPedido.CANCELADA : seloDoPrestador[situacao];
  const podeOrcar = !meuOrcamento && !contratacao && p.status === 'ABERTA';
  const km = distanciaKm(usuario?.bairro, p.bairro);
  const fotos = p.quantidadeFotos ?? 0;

  return (
    <ScrollView
      ref={rolagem}
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
      <View style={estilos.topo}>
        <Text style={estilos.numero}>Pedido #{p.id}</Text>
        <Selo texto={status.texto} tom={status.tom} />
      </View>
      <Text style={estilos.descricao}>{p.descricao}</Text>
      {!!p.observacao && (
        <Text style={estilos.observacao}>
          <Text style={estilos.observacaoRotulo}>Informação adicional: </Text>
          {p.observacao}
        </Text>
      )}
      <GaleriaFotos solicitacaoId={p.id} quantidade={p.quantidadeFotos ?? 0} />
      <View style={estilos.infos}>
        <InfoLinha
          icone="location-outline"
          texto={`${p.bairro} · ${textoDistancia(km).toLowerCase()}`}
        />
        <InfoLinha
          icone="time-outline"
          texto={`Publicado ${formatarQuando(p.criadaEm).toLowerCase()}`}
        />
        <InfoLinha icone="person-outline" texto={`Cliente: ${p.cliente.nome.split(' ')[0]}`} />
        {fotos > 0 && (
          <InfoLinha
            icone="camera-outline"
            texto={fotos === 1 ? '1 foto anexada' : `${fotos} fotos anexadas`}
          />
        )}
        {!contratacao && (
          <InfoLinha
            icone="lock-closed-outline"
            texto="Rua, número e telefone aparecem depois que o cliente contratar você."
          />
        )}
      </View>

      {podeOrcar && (
        <Botao
          titulo="Enviar orçamento"
          aoPressionar={() =>
            rolagem.current?.scrollTo({ y: posicaoFormulario.current, animated: true })
          }
          estilo={estilos.ctaTopo}
        />
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

      {!!p.cliente.telefone && (
        <Cartao>
          <View style={estilos.contato}>
            <Ionicons name="call-outline" size={20} color={cores.secundaria} />
            <Text style={estilos.contatoTexto}>{p.cliente.telefone}</Text>
            <Botao
              titulo="Ligar"
              variante="contorno"
              estilo={estilos.botaoPequeno}
              aoPressionar={() => Linking.openURL(`tel:${p.cliente.telefone}`)}
            />
          </View>
        </Cartao>
      )}

      {contratacao ? (
        <>
          <Titulo>Serviço contratado</Titulo>
          <Cartao>
            <View style={estilos.linha}>
              <Text style={estilos.valor}>{formatarMoeda(contratacao.valorAcordado)}</Text>
              <Selo
                texto={seloContratacao[contratacao.status].texto}
                tom={seloContratacao[contratacao.status].tom}
              />
            </View>
            <Text style={estilos.meta}>
              Agendado para {formatarDataHora(contratacao.dataAgendada)}
            </Text>
            {!!p.endereco && (
              <View style={estilos.contato}>
                <Ionicons name="location-outline" size={20} color={cores.secundaria} />
                <Text style={estilos.contatoTexto}>
                  {p.endereco} · {p.bairro}
                </Text>
              </View>
            )}
            {contratacao.status === 'Agendada' && (
              <Botao
                titulo="Iniciar serviço"
                carregando={iniciar.isPending}
                aoPressionar={() => iniciar.mutate()}
                estilo={estilos.botao}
              />
            )}
            {contratacao.status === 'EmAndamento' && (
              <Botao
                titulo="Concluir serviço"
                variante="secundaria"
                carregando={concluir.isPending}
                aoPressionar={() => concluir.mutate()}
                estilo={estilos.botao}
              />
            )}
            {contratacao.status === 'Concluida' && (
              <Text style={estilos.sucesso}>
                Serviço concluído. O cliente foi convidado a avaliar você.
              </Text>
            )}
            {(iniciar.isError || concluir.isError) && (
              <Text style={estilos.erro}>{mensagemDeErro(iniciar.error ?? concluir.error)}</Text>
            )}
          </Cartao>
        </>
      ) : meuOrcamento ? (
        <>
          <Titulo>Seu orçamento</Titulo>
          <Cartao>
            <View style={estilos.linha}>
              <Text style={estilos.valor}>{formatarMoeda(meuOrcamento.valor)}</Text>
              <Selo
                texto={seloOrcamento[meuOrcamento.status].texto}
                tom={seloOrcamento[meuOrcamento.status].tom}
              />
            </View>
            <Text style={estilos.meta}>Prazo de {meuOrcamento.prazoDias} dia(s)</Text>
            <Text style={estilos.meta}>
              {situacao === 'outroContratado'
                ? 'O cliente escolheu outro prestador desta vez.'
                : situacao === 'recusado'
                  ? 'O cliente recusou este orçamento.'
                  : situacao === 'suaVez'
                    ? 'O cliente fez uma proposta. Responda abaixo.'
                    : 'Aguardando o cliente escolher. Você será avisado.'}
            </Text>
            {meuOrcamento.status === 'Pendente' && (
              <Negociacao orcamento={meuOrcamento} eu="Prestador" precoMaximo={p.precoMaximo} />
            )}
          </Cartao>
        </>
      ) : p.status === 'ABERTA' ? (
        <View onLayout={(e) => (posicaoFormulario.current = e.nativeEvent.layout.y)}>
          <Titulo>Enviar orçamento</Titulo>
          <Subtitulo>{`Faixa de referência para este serviço: ${formatarFaixa(p.precoMinimo, p.precoMaximo)}. Você pode cobrar mais, mas explique o motivo na observação.`}</Subtitulo>
          <Cartao>
            <Text style={estilos.rotuloAtalho}>Sugestões pela faixa de referência</Text>
            <View style={estilos.atalhos}>
              {[
                { rotulo: 'Mínimo', v: p.precoMinimo },
                { rotulo: 'Meio da faixa', v: Math.round((p.precoMinimo + p.precoMaximo) / 2) },
                { rotulo: 'Máximo', v: p.precoMaximo },
              ].map((a) => (
                <Botao
                  key={a.rotulo}
                  titulo={`${a.rotulo}\n${formatarMoeda(a.v)}`}
                  variante="contorno"
                  estilo={estilos.atalho}
                  aoPressionar={() => setValor(String(a.v))}
                />
              ))}
            </View>
            <CampoTexto
              rotulo="Valor (R$)"
              keyboardType="decimal-pad"
              placeholder="Ex.: 150"
              value={valor}
              onChangeText={setValor}
              erro={erros.valor}
            />
            <CampoTexto
              rotulo="Prazo (dias)"
              keyboardType="number-pad"
              value={prazo}
              onChangeText={setPrazo}
              erro={erros.prazoDias}
            />
            <CampoTexto
              rotulo="Observação (opcional)"
              multiline
              placeholder="Ex.: levo todo o material"
              value={observacao}
              onChangeText={setObservacao}
              maxLength={500}
              erro={erros.observacao}
            />
            {enviar.isError && <Text style={estilos.erro}>{mensagemDeErro(enviar.error)}</Text>}
            <Botao
              titulo="Enviar orçamento"
              carregando={enviar.isPending}
              aoPressionar={aoEnviar}
            />
          </Cartao>
        </View>
      ) : null}
    </ScrollView>
  );
}

function InfoLinha({ icone, texto }: { icone: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={estilos.infoLinha}>
      <Ionicons name={icone} size={16} color={cores.secundaria} />
      <Text style={estilos.infoTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  infos: { gap: espacos.xs, marginTop: espacos.md, marginBottom: espacos.sm },
  infoLinha: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  infoTexto: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.texto,
  },
  ctaTopo: { marginVertical: espacos.sm },
  rotuloAtalho: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginBottom: espacos.xs,
  },
  atalhos: { flexDirection: 'row', gap: espacos.xs, marginBottom: espacos.md },
  atalho: { flex: 1, paddingHorizontal: 2 },
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.textoSuave },
  observacao: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginTop: espacos.sm,
  },
  observacaoRotulo: { fontFamily: fontes.seminegrito, color: cores.texto },
  descricao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.medio,
    color: cores.texto,
    marginTop: espacos.sm,
  },
  meta: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginVertical: espacos.xs,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacos.sm,
  },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.primariaEscura },
  contato: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  contatoTexto: { flex: 1, fontFamily: fontes.media, color: cores.secundaria },
  botaoPequeno: { minHeight: 36 },
  botao: { marginTop: espacos.md },
  sucesso: {
    fontFamily: fontes.media,
    color: cores.sucesso,
    backgroundColor: cores.sucessoClaro,
    padding: espacos.sm,
    borderRadius: raio.medio,
    marginTop: espacos.sm,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
});
