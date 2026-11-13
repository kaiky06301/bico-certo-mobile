import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { OrigemTriagem, Urgencia } from '../models/solicitacao';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { formatarFaixa } from '../utils/formatacao';
import { Cartao } from './Cartao';
import { Selo } from './Selo';
import { seloUrgencia } from './selos';

interface Props {
  categoria: string;
  urgencia: Urgencia;
  precoMinimo: number;
  precoMaximo: number;
  resumo: string;
  dicaSeguranca: string;
  origem: OrigemTriagem;
  prestadoresDisponiveis?: number;
}

/** Resultado da triagem: o que a IA entendeu do problema e quanto e justo pagar. */
export function CartaoTriagem(props: Props) {
  const urgencia = seloUrgencia[props.urgencia];
  return (
    <Cartao estilo={estilos.cartao}>
      <View style={estilos.cabecalho}>
        <Ionicons name="sparkles" size={18} color={cores.primaria} />
        <Text style={estilos.cabecalhoTexto}>
          {props.origem === 'IA' ? 'Análise do Bico Certo' : 'Análise automática'}
        </Text>
      </View>

      <Text style={estilos.categoria}>{props.categoria}</Text>
      <Text style={estilos.resumo}>{props.resumo}</Text>
      <Selo texto={urgencia.texto} tom={urgencia.tom} />

      <View style={estilos.preco}>
        <Text style={estilos.precoRotulo}>Preço justo para esse serviço</Text>
        <Text style={estilos.precoValor}>
          {formatarFaixa(props.precoMinimo, props.precoMaximo)}
        </Text>
      </View>

      <View style={estilos.dica}>
        <Ionicons name="shield-checkmark-outline" size={18} color={cores.secundaria} />
        <Text style={estilos.dicaTexto}>{props.dicaSeguranca}</Text>
      </View>

      {props.prestadoresDisponiveis !== undefined && (
        <Text style={estilos.prestadores}>
          {props.prestadoresDisponiveis > 0
            ? `${props.prestadoresDisponiveis} prestador(es) dessa área serão avisados.`
            : 'Ainda não há prestadores dessa área cadastrados, mas seu pedido fica registrado.'}
        </Text>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderColor: cores.primaria, borderWidth: 1.5 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    marginBottom: espacos.sm,
  },
  cabecalhoTexto: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.pequeno,
    color: cores.primaria,
  },
  categoria: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  resumo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginVertical: espacos.sm,
  },
  preco: {
    backgroundColor: cores.primariaClara,
    borderRadius: raio.medio,
    padding: espacos.md,
    marginTop: espacos.md,
  },
  precoRotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.primariaEscura,
  },
  precoValor: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.primariaEscura,
  },
  dica: {
    flexDirection: 'row',
    gap: espacos.sm,
    backgroundColor: cores.secundariaClara,
    borderRadius: raio.medio,
    padding: espacos.md,
    marginTop: espacos.sm,
  },
  dicaTexto: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.secundaria,
  },
  prestadores: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.sm,
  },
});
