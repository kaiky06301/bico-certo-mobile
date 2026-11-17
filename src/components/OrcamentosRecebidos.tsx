import { StyleSheet, Text, View } from 'react-native';

import { Orcamento } from '../models/contratacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarMoeda } from '../utils/formatacao';
import { Botao } from './Botao';
import { Cartao } from './Cartao';
import { ResumoPrestador } from './ResumoPrestador';
import { Selo } from './Selo';

interface Props {
  orcamentos: Orcamento[];
  carregando: boolean;
  aoVerProposta: (orcamento: Orcamento) => void;
}

/** "Orçamentos recebidos": um resumo por prestador e o botão para abrir a proposta. */
export function OrcamentosRecebidos({ orcamentos, carregando, aoVerProposta }: Props) {
  const pendentes = orcamentos.filter((o) => o.status === 'Pendente');
  const recusados = orcamentos.filter((o) => o.status !== 'Pendente');
  const maisBarato = pendentes.length > 1 ? Math.min(...pendentes.map((o) => o.valor)) : undefined;

  return (
    <Cartao estilo={estilos.cartao}>
      <Text style={estilos.titulo}>Orçamentos recebidos</Text>
      <View style={estilos.cabecalho}>
        <Text style={estilos.textoSuave}>
          {carregando
            ? 'Buscando orçamentos...'
            : pendentes.length === 0
              ? 'Os prestadores da categoria já foram avisados. Os orçamentos aparecem aqui.'
              : `${pendentes.length} ${pendentes.length === 1 ? 'profissional interessado' : 'profissionais interessados'}`}
        </Text>
        {pendentes.length > 0 && (
          <Selo
            texto={`${pendentes.length} ${pendentes.length === 1 ? 'proposta' : 'propostas'}`}
            tom="sucesso"
          />
        )}
      </View>

      {[...pendentes, ...recusados].map((orcamento, i) => {
        const pendente = orcamento.status === 'Pendente';
        const aguardandoVoce =
          orcamento.propostaPendente && orcamento.propostaPendente.autor === 'Prestador';
        return (
          <View
            key={orcamento.id}
            style={[estilos.item, i > 0 && estilos.divisor, !pendente && estilos.apagado]}
          >
            <View style={estilos.linha}>
              <ResumoPrestador usuarioId={orcamento.prestadorId} nome={orcamento.prestadorNome} />
              <View style={estilos.valorCaixa}>
                <Text style={estilos.valor}>{formatarMoeda(orcamento.valor)}</Text>
                {orcamento.valor === maisBarato && (
                  <Text style={estilos.destaque}>Menor valor</Text>
                )}
              </View>
            </View>
            {!pendente && <Selo texto="Recusado" tom="neutro" />}
            {aguardandoVoce && (
              <Text style={estilos.aviso}>
                Contraproposta de {formatarMoeda(orcamento.propostaPendente!.valor)} aguardando você
              </Text>
            )}
            {pendente && (
              <Botao
                titulo="Ver proposta"
                variante={i === 0 ? 'primaria' : 'contorno'}
                aoPressionar={() => aoVerProposta(orcamento)}
                estilo={estilos.botao}
              />
            )}
          </View>
        );
      })}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { marginTop: espacos.md },
  titulo: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacos.sm,
    marginTop: espacos.xs,
    marginBottom: espacos.sm,
  },
  textoSuave: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
  },
  item: { paddingVertical: espacos.md, gap: espacos.sm },
  divisor: { borderTopWidth: 1, borderTopColor: cores.borda },
  apagado: { opacity: 0.55 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  valorCaixa: { alignItems: 'flex-end' },
  valor: { fontFamily: fontes.negrito, fontSize: tamanhos.medio, color: cores.texto },
  destaque: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.sucesso },
  aviso: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.alerta },
  botao: { marginTop: espacos.xs },
});
