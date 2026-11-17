import { StyleSheet, Text, View } from 'react-native';

import { Contratacao, Orcamento } from '../models/contratacao';
import { Solicitacao } from '../models/solicitacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarDataHora, formatarMoeda } from '../utils/formatacao';
import { Cartao } from './Cartao';

interface Evento {
  titulo: string;
  detalhe: string;
  quando: string;
}

/** Linha do tempo montada com os dados das duas APIs (pedido, orçamentos e contratação). */
function montarEventos(p: Solicitacao, orcamentos: Orcamento[], contratacao?: Contratacao) {
  const eventos: Evento[] = [
    { titulo: 'Pedido criado', detalhe: `Bairro ${p.bairro}`, quando: p.criadaEm },
    {
      titulo: p.origemTriagem === 'IA' ? 'Análise da IA concluída' : 'Análise automática concluída',
      detalhe: `Serviço identificado como ${p.categoria.nome.toLowerCase()}`,
      quando: p.criadaEm,
    },
  ];
  for (const o of orcamentos) {
    eventos.push({
      titulo: 'Orçamento recebido',
      detalhe: `${o.prestadorNome} enviou uma proposta de ${formatarMoeda(o.valorInicial)}`,
      quando: o.criadoEm,
    });
    if (o.status === 'Recusado' && !contratacao) {
      eventos.push({
        titulo: 'Orçamento recusado',
        detalhe: `Proposta de ${o.prestadorNome}`,
        quando: o.atualizadoEm,
      });
    }
  }
  if (contratacao) {
    const prestador = orcamentos.find((o) => o.id === contratacao.orcamentoId)?.prestadorNome;
    eventos.push({
      titulo: 'Orçamento aceito',
      detalhe: `${prestador ?? 'Prestador'} contratado por ${formatarMoeda(
        contratacao.valorAcordado,
      )} para ${formatarDataHora(contratacao.dataAgendada)}`,
      quando: contratacao.criadaEm,
    });
    if (contratacao.status === 'EmAndamento' || contratacao.status === 'Concluida') {
      eventos.push({
        titulo: 'Serviço iniciado',
        detalhe: 'O prestador começou o atendimento',
        quando: contratacao.atualizadaEm,
      });
    }
  } else if (p.status !== 'ABERTA' && p.prestador) {
    eventos.push({
      titulo: 'Prestador definido',
      detalhe: `${p.prestador.nome} assumiu o pedido`,
      quando: p.atualizadaEm,
    });
  }
  if (p.status === 'CONCLUIDA') {
    eventos.push({
      titulo: 'Serviço concluído',
      detalhe: 'Avalie o prestador',
      quando: p.atualizadaEm,
    });
  }
  if (p.status === 'CANCELADA') {
    eventos.push({
      titulo: 'Pedido cancelado',
      detalhe: p.motivoCancelamento ? `Motivo: ${p.motivoCancelamento}` : 'Cancelado pelo cliente',
      quando: p.atualizadaEm,
    });
  }
  return eventos.sort((a, b) => a.quando.localeCompare(b.quando));
}

interface Props {
  pedido: Solicitacao;
  orcamentos: Orcamento[];
  contratacao?: Contratacao;
}

export function HistoricoPedido({ pedido, orcamentos, contratacao }: Props) {
  const eventos = montarEventos(pedido, orcamentos, contratacao);
  return (
    <Cartao estilo={estilos.cartao}>
      <Text style={estilos.titulo}>Histórico do pedido</Text>
      {eventos.map((e, i) => {
        const ultimo = i === eventos.length - 1;
        return (
          <View key={`${e.titulo}-${i}`} style={estilos.evento} accessible>
            <View style={estilos.marcador}>
              <View style={[estilos.bolinha, ultimo && estilos.bolinhaAtual]}>
                <Text style={[estilos.numero, ultimo && estilos.numeroAtual]}>{i + 1}</Text>
              </View>
              {!ultimo && <View style={estilos.traco} />}
            </View>
            <View style={estilos.textos}>
              <Text style={estilos.eventoTitulo}>{e.titulo}</Text>
              <Text style={estilos.eventoDetalhe}>{e.detalhe}</Text>
              <Text style={estilos.quando}>{formatarDataHora(e.quando)}</Text>
            </View>
          </View>
        );
      })}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { marginTop: espacos.md },
  titulo: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.texto,
    marginBottom: espacos.md,
  },
  evento: { flexDirection: 'row', gap: espacos.md },
  marcador: { alignItems: 'center', width: 28 },
  bolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  bolinhaAtual: { borderColor: cores.primaria, backgroundColor: cores.primaria },
  numero: { fontFamily: fontes.seminegrito, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  numeroAtual: { color: cores.branco },
  traco: { flex: 1, width: 2, backgroundColor: cores.borda, marginVertical: 2 },
  textos: { flex: 1, paddingBottom: espacos.md },
  eventoTitulo: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.texto },
  eventoDetalhe: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
  },
  quando: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
