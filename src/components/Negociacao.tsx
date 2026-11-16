import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePropostas } from '../hooks/consultas';
import { AutorProposta, Orcamento, StatusProposta } from '../models/contratacao';
import { enviarProposta, responderProposta } from '../services/orcamentoService';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { mensagemDeErro } from '../utils/erros';
import { formatarDataHora, formatarMoeda, gerarChaveUnica } from '../utils/formatacao';
import { esquemaProposta, validar } from '../validation/esquemas';
import { Botao } from './Botao';
import { CampoTexto } from './CampoTexto';

interface Props {
  orcamento: Orcamento;
  /** Quem está usando a tela: o cliente dono do pedido ou o prestador que enviou o orçamento. */
  eu: AutorProposta;
  /** Teto do preço justo (mostrado como dica no formulário). */
  precoMaximo?: number;
}

const textoStatus: Record<StatusProposta, string> = {
  Pendente: 'esperando resposta',
  Aceita: 'aceita',
  Recusada: 'recusada',
  Substituida: 'trocada por outra proposta',
};

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

      {recebida && (
        <View style={estilos.recebida}>
          <View style={estilos.linha}>
            <Ionicons name="chatbubbles-outline" size={18} color={cores.primariaEscura} />
            <Text style={estilos.recebidaTitulo}>
              {pendente.autorNome} propôs {formatarMoeda(pendente.valor)}
            </Text>
          </View>
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
            rotulo="Comentário (opcional)"
            multiline
            placeholder={
              eu === 'Cliente' ? 'Ex.: eu já tenho o material' : 'Ex.: inclui a troca da peça'
            }
            value={comentario}
            onChangeText={setComentario}
            maxLength={300}
            erro={erros.comentario}
          />
          {!!precoMaximo && (
            <Text style={estilos.dica}>
              Pelo preço justo, propostas acima de {formatarMoeda(precoMaximo)} podem ser barradas.
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
      ) : (
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
        {historicoAberto ? 'Esconder negociação' : 'Ver histórico da negociação'}
      </Text>
      {historicoAberto && (
        <View style={estilos.historico}>
          {historico.isLoading && <Text style={estilos.dica}>Carregando...</Text>}
          {historico.data?.length === 0 && (
            <Text style={estilos.dica}>
              Ainda não houve negociação. Vale o valor de {formatarMoeda(orcamento.valor)}.
            </Text>
          )}
          {historico.data?.map((proposta) => (
            <View key={proposta.id} style={estilos.itemHistorico}>
              <Text style={estilos.itemTitulo}>
                {proposta.autor === eu ? 'Você' : proposta.autorNome}:{' '}
                {formatarMoeda(proposta.valor)}{' '}
                <Text style={estilos.itemStatus}>({textoStatus[proposta.status]})</Text>
              </Text>
              {!!proposta.comentario && (
                <Text style={estilos.comentario}>{`“${proposta.comentario}”`}</Text>
              )}
              <Text style={estilos.itemData}>{formatarDataHora(proposta.criadaEm)}</Text>
            </View>
          ))}
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
  itemHistorico: {},
  itemTitulo: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.texto },
  itemStatus: { fontFamily: fontes.regular, color: cores.textoSuave },
  itemData: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
