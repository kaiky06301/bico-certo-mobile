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

/** Resultado da triagem: o que a IA entendeu do problema e a faixa de referência de preço. */
export function CartaoTriagem(props: Props) {
  const urgencia = seloUrgencia[props.urgencia];
  const porIa = props.origem === 'IA';
  return (
    <Cartao estilo={estilos.cartao}>
      <View style={estilos.cabecalho}>
        <Ionicons name="sparkles" size={18} color={cores.primaria} />
        <Text style={estilos.cabecalhoTexto}>Análise do Bico Certo</Text>
        <Selo
          texto={porIa ? 'Analisado' : 'Análise automática'}
          tom={porIa ? 'sucesso' : 'alerta'}
        />
      </View>

      <Text style={estilos.secao}>TIPO DE SERVIÇO</Text>
      <Text style={estilos.categoria}>{props.categoria}</Text>
      <Text style={estilos.resumo}>{props.resumo}</Text>

      <View style={estilos.divisor} />
      <Text style={estilos.secao}>URGÊNCIA</Text>
      <Selo texto={urgencia.texto} tom={urgencia.tom} />

      <View style={estilos.divisor} />
      <Text style={estilos.secao}>FAIXA DE PREÇO DE REFERÊNCIA</Text>
      <Text style={estilos.precoValor}>{formatarFaixa(props.precoMinimo, props.precoMaximo)}</Text>
      <Text style={estilos.nota}>Estimativa sujeita à avaliação presencial do prestador.</Text>

      <View style={estilos.dica}>
        <Ionicons name="shield-checkmark-outline" size={18} color={cores.secundaria} />
        <View style={estilos.dicaTextos}>
          <Text style={estilos.dicaTitulo}>Dica de segurança</Text>
          <Text style={estilos.dicaTexto}>{props.dicaSeguranca}</Text>
        </View>
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
    marginBottom: espacos.md,
  },
  cabecalhoTexto: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.texto,
  },
  secao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    letterSpacing: 0.5,
    marginBottom: espacos.xs,
  },
  categoria: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  resumo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espacos.md },
  precoValor: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.grande,
    color: cores.primariaEscura,
  },
  nota: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  dica: {
    flexDirection: 'row',
    gap: espacos.sm,
    backgroundColor: cores.secundariaClara,
    borderRadius: raio.medio,
    padding: espacos.md,
    marginTop: espacos.md,
  },
  dicaTextos: { flex: 1 },
  dicaTitulo: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.secundaria,
  },
  dicaTexto: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.secundaria },
  prestadores: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.sm,
  },
});
