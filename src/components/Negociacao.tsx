import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePropostas } from '../hooks/consultas';
import { AutorProposta, Orcamento, Proposta } from '../models/contratacao';
import { enviarProposta, responderProposta } from '../services/orcamentoService';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { mensagemDeErro } from '../utils/erros';
import { formatarMoeda, formatarQuando, gerarChaveUnica } from '../utils/formatacao';
import { esquemaProposta, exigirJustificativa, validar } from '../validation/esquemas';
import { Botao } from './Botao';
import { CampoTexto } from './CampoTexto';

interface Props {
  orcamento: Orcamento;
  /** Quem está usando a tela: o cliente dono do pedido ou o prestador que enviou o orçamento. */
  eu: AutorProposta;
  /** Fim da faixa de referência da triagem: acima dele o comentário passa a ser obrigatório. */
  precoMaximo?: number;
}

interface EventoNegociacao {
  quando: string;
  texto: string;
  comentario?: string | null;
  tom: 'neutro' | 'sucesso' | 'perigo';
}

/** Linha do tempo: orçamento enviado, cada proposta e cada resposta, em ordem. */
function montarLinhaDoTempo(orcamento: Orcamento, propostas: Proposta[], eu: AutorProposta) {
  const nomeDe = (autor: AutorProposta) =>
    autor === eu ? 'Você' : autor === 'Cliente' ? 'O cliente' : orcamento.prestadorNome;
  const eventos: EventoNegociacao[] = [
    {
      quando: orcamento.criadoEm,
      texto: `${nomeDe('Prestador')} enviou o orçamento de ${formatarMoeda(orcamento.valorInicial)}`,
      tom: 'neutro',
    },
  ];
  for (const p of propostas) {
    eventos.push({
      quando: p.criadaEm,
      texto: `${nomeDe(p.autor)} ${p.autor === 'Cliente' && p.autor !== eu ? 'pediu' : 'propôs'} ${formatarMoeda(p.valor)}${p.status === 'Substituida' ? ' (substituída por outra proposta)' : ''}`,
      comentario: p.comentario,
      tom: 'neutro',
    });
    if (p.respondidaEm && (p.status === 'Aceita' || p.status === 'Recusada')) {
      const quemRespondeu: AutorProposta = p.autor === 'Cliente' ? 'Prestador' : 'Cliente';
      eventos.push({
        quando: p.respondidaEm,
        texto: `${nomeDe(quemRespondeu)} ${p.status === 'Aceita' ? 'aceitou' : 'recusou'} ${formatarMoeda(p.valor)}`,
        tom: p.status === 'Aceita' ? 'sucesso' : 'perigo',
      });
    }
  }
  return eventos.sort((a, b) => a.quando.localeCompare(b.quando));
}

/**
 * Negociação do valor de um orçamento: quem recebe uma proposta pode aceitar, recusar ou mandar outra.
 * Se ninguém aceitar, continua valendo o valor atual do orçamento.
 */
export function Negociacao({ orcamento, eu, precoMaximo }: Props) {
  const queryClient = useQueryClient();
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [valor, setValor] = useState('');
  const [comentario, setComentario] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  // mesma chave enquanto o formulário estiver aberto: toque duplo não cria duas propostas
  const chave = useRef(gerarChaveUnica());
  const historico = usePropostas(orcamento.id, historicoAberto);

  const pendente = orcamento.propostaPendente;
  const recebida = pendente && pendente.autor !== eu;
  const enviadaPorMim = pendente && pendente.autor === eu;
  const outraParte = eu === 'Cliente' ? 'o prestador' : 'o cliente';
  const expirado = orcamento.expirado;

  function atualizar() {
    // ['orcamentos'] cobre a lista de orçamentos do pedido e o histórico da negociação
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
  }

  const propor = useMutation({
    mutationFn: () =>
      enviarProposta(
        orcamento.id,
        {
          valor: Number(valor.replace(',', '.')),
          comentario: comentario.trim() || undefined,
        },
        chave.current,
      ),
    onSuccess: () => {
      chave.current = gerarChaveUnica();
      setFormularioAberto(false);
      setValor('');
      setComentario('');
      atualizar();
    },
  });

  const responder = useMutation({
    mutationFn: (aceita: boolean) => responderProposta(orcamento.id, pendente!.id, aceita),
    onSuccess: atualizar,
  });

  async function aoEnviar() {
    const dados = { valor: Number(valor.replace(',', '.')), comentario };
    const encontrados = await validar(esquemaProposta, dados);
    const semMotivo = exigirJustificativa(dados.valor, precoMaximo, comentario);
    if (semMotivo && !encontrados.comentario) encontrados.comentario = semMotivo;
    setErros(encontrados);
    if (!Object.keys(encontrados).length) propor.mutate();
  }

  return (
    <View style={estilos.container}>
      {orcamento.valor !== orcamento.valorInicial && (
        <Text style={estilos.combinado}>
          Valor combinado na negociação (o inicial era {formatarMoeda(orcamento.valorInicial)})
        </Text>
      )}

      {expirado && (
        <Text style={estilos.expirado}>
          {eu === 'Prestador'
            ? 'Este orçamento expirou. Edite o orçamento para renovar a validade e continuar negociando.'
            : 'Este orçamento expirou. Peça ao prestador para renovar ou escolha outro orçamento.'}
        </Text>
      )}

      {recebida && !expirado && (
        <View style={estilos.recebida}>
          <View style={estilos.linha}>
            <Ionicons name="chatbubbles-outline" size={18} color={cores.primariaEscura} />
            <Text style={estilos.recebidaTitulo}>
              {pendente.autorNome} propôs {formatarMoeda(pendente.valor)}
            </Text>
          </View>
          {!!precoMaximo && pendente.valor > precoMaximo && (
            <Text style={estilos.acimaFaixa}>Acima da faixa de referência</Text>
          )}
          {!!pendente.comentario && (
            <Text style={estilos.comentario}>{`“${pendente.comentario}”`}</Text>
          )}
          {responder.isError && <Text style={estilos.erro}>{mensagemDeErro(responder.error)}</Text>}
          <View style={estilos.botoes}>
            <Botao
              titulo="Aceitar"
              estilo={estilos.botaoMetade}
              carregando={responder.isPending && responder.variables === true}
              desabilitado={responder.isPending}
              aoPressionar={() => responder.mutate(true)}
            />
            <Botao
              titulo="Recusar"
              variante="contorno"
              estilo={estilos.botaoMetade}
              carregando={responder.isPending && responder.variables === false}
              desabilitado={responder.isPending}
              aoPressionar={() => responder.mutate(false)}
            />
          </View>
          <Text style={estilos.dica}>
            Se recusar, continua valendo {formatarMoeda(orcamento.valor)}.
          </Text>
        </View>
      )}

      {enviadaPorMim && (
        <Text style={estilos.aguardando}>
          Você propôs {formatarMoeda(pendente.valor)}. Aguardando {outraParte} responder.
        </Text>
      )}

      {formularioAberto ? (
        <View style={estilos.formulario}>
          <CampoTexto
            rotulo="Novo valor (R$)"
            keyboardType="decimal-pad"
            placeholder={`Atual: ${formatarMoeda(orcamento.valor)}`}
            value={valor}
            onChangeText={setValor}
            erro={erros.valor}
          />
          <CampoTexto
            rotulo={
              eu === 'Prestador' ? 'Por que mudou o valor? (opcional)' : 'Comentário (opcional)'
            }
            multiline
            placeholder={
              eu === 'Cliente'
                ? 'Ex.: eu já tenho o material'
                : 'Ex.: precisa trocar uma peça que não estava prevista'
            }
            value={comentario}
            onChangeText={setComentario}
            maxLength={300}
            erro={erros.comentario}
          />
          {!!precoMaximo && (
            <Text style={estilos.dica}>
              Faixa de referência até {formatarMoeda(precoMaximo)}. Acima disso, explique o motivo
              no comentário.
            </Text>
          )}
          {propor.isError && <Text style={estilos.erro}>{mensagemDeErro(propor.error)}</Text>}
          <Botao titulo="Enviar proposta" carregando={propor.isPending} aoPressionar={aoEnviar} />
          <Botao
            titulo="Voltar"
            variante="contorno"
            estilo={estilos.botaoEspaco}
            aoPressionar={() => setFormularioAberto(false)}
          />
        </View>
      ) : expirado ? null : (
        <Botao
          titulo={recebida ? 'Fazer contraproposta' : 'Propor outro valor'}
          variante="secundaria"
          estilo={estilos.botaoEspaco}
          aoPressionar={() => {
            setErros({});
            setFormularioAberto(true);
          }}
        />
      )}

      <Text
        accessibilityRole="button"
        style={estilos.linkHistorico}
        onPress={() => setHistoricoAberto((aberto) => !aberto)}
      >
        {historicoAberto ? 'Esconder histórico' : 'Ver histórico da negociação'}
      </Text>
      {historicoAberto && (
        <View style={estilos.historico}>
          {historico.isLoading && <Text style={estilos.dica}>Carregando...</Text>}
          {historico.data &&
            montarLinhaDoTempo(orcamento, historico.data, eu).map((e, i) => (
              <View key={`${e.quando}-${i}`} style={estilos.itemHistorico}>
                <View
                  style={[
                    estilos.ponto,
                    e.tom === 'sucesso' && { backgroundColor: cores.sucesso },
                    e.tom === 'perigo' && { backgroundColor: cores.perigo },
                  ]}
                />
                <View style={estilos.itemTextos}>
                  <Text style={estilos.itemData}>{formatarQuando(e.quando)}</Text>
                  <Text style={estilos.itemTitulo}>{e.texto}</Text>
                  {!!e.comentario && <Text style={estilos.comentario}>{`“${e.comentario}”`}</Text>}
                </View>
              </View>
            ))}
          {historico.data?.length === 0 && (
            <Text style={estilos.dica}>
              Ainda não houve contraproposta. Vale o valor de {formatarMoeda(orcamento.valor)}.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginTop: espacos.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  combinado: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.sucesso,
    marginBottom: espacos.xs,
  },
  recebida: {
    backgroundColor: cores.primariaClara,
    borderRadius: raio.medio,
    padding: espacos.sm,
    marginTop: espacos.xs,
  },
  recebidaTitulo: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.primariaEscura,
  },
  comentario: {
    fontFamily: fontes.regular,
    fontStyle: 'italic',
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  botoes: { flexDirection: 'row', gap: espacos.sm, marginTop: espacos.sm },
  botaoMetade: { flex: 1 },
  botaoEspaco: { marginTop: espacos.sm },
  aguardando: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.alerta,
    backgroundColor: cores.alertaClaro,
    borderRadius: raio.medio,
    padding: espacos.sm,
    marginTop: espacos.xs,
  },
  formulario: { marginTop: espacos.md },
  acimaFaixa: {
    alignSelf: 'flex-start',
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.alerta,
    backgroundColor: cores.alertaClaro,
    borderRadius: raio.medio,
    paddingHorizontal: espacos.sm,
    paddingVertical: 2,
    marginTop: espacos.xs,
  },
  dica: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginVertical: espacos.xs,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  linkHistorico: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.secundaria,
    textDecorationLine: 'underline',
    paddingVertical: espacos.sm,
    marginTop: espacos.xs,
  },
  historico: {
    borderLeftWidth: 2,
    borderLeftColor: cores.borda,
    paddingLeft: espacos.sm,
    gap: espacos.sm,
  },
  itemHistorico: { flexDirection: 'row', gap: espacos.sm },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: cores.secundaria,
    marginTop: 5,
    marginLeft: -espacos.sm - 6,
  },
  itemTextos: { flex: 1 },
  itemTitulo: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.texto },
  expirado: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.perigo,
    backgroundColor: cores.perigoClaro,
    borderRadius: raio.medio,
    padding: espacos.sm,
    marginTop: espacos.xs,
  },
  itemData: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
