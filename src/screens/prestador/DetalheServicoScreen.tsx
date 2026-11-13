import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { Carregando, MensagemErro } from '../../components/Estados';
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
  gerarChaveUnica,
} from '../../utils/formatacao';
import { esquemaOrcamento, validar } from '../../validation/esquemas';

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
  const status = seloStatusPedido[p.status];

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
      <View style={estilos.topo}>
        <Text style={estilos.numero}>Pedido #{p.id}</Text>
        <Selo texto={status.texto} tom={status.tom} />
      </View>
      <Text style={estilos.descricao}>{p.descricao}</Text>
      <Text style={estilos.meta}>
        {p.cliente.nome} · {p.bairro} · {formatarDataHora(p.criadaEm)}
      </Text>

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
          <Titulo>Servico contratado</Titulo>
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
            {contratacao.status === 'Agendada' && (
              <Botao
                titulo="Iniciar servico"
                carregando={iniciar.isPending}
                aoPressionar={() => iniciar.mutate()}
                estilo={estilos.botao}
              />
            )}
            {contratacao.status === 'EmAndamento' && (
              <Botao
                titulo="Concluir servico"
                variante="secundaria"
                carregando={concluir.isPending}
                aoPressionar={() => concluir.mutate()}
                estilo={estilos.botao}
              />
            )}
            {contratacao.status === 'Concluida' && (
              <Text style={estilos.sucesso}>
                Servico concluido. O cliente foi convidado a avaliar voce.
              </Text>
            )}
            {(iniciar.isError || concluir.isError) && (
              <Text style={estilos.erro}>{mensagemDeErro(iniciar.error ?? concluir.error)}</Text>
            )}
          </Cartao>
        </>
      ) : meuOrcamento ? (
        <>
          <Titulo>Seu orcamento</Titulo>
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
              {meuOrcamento.status === 'Recusado'
                ? 'O cliente escolheu outro prestador desta vez.'
                : 'Aguardando o cliente escolher. Voce sera avisado.'}
            </Text>
          </Cartao>
        </>
      ) : p.status === 'ABERTA' ? (
        <>
          <Titulo>Enviar orcamento</Titulo>
          <Subtitulo>{`Preco justo para este servico: ${formatarFaixa(p.precoMinimo, p.precoMaximo)}.`}</Subtitulo>
          <Cartao>
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
              rotulo="Observacao (opcional)"
              multiline
              placeholder="Ex.: levo todo o material"
              value={observacao}
              onChangeText={setObservacao}
              maxLength={500}
            />
            {enviar.isError && <Text style={estilos.erro}>{mensagemDeErro(enviar.error)}</Text>}
            <Botao
              titulo="Enviar orcamento"
              carregando={enviar.isPending}
              aoPressionar={aoEnviar}
            />
          </Cartao>
        </>
      ) : null}
    </ScrollView>
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
