import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Solicitacao } from '../models/solicitacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarData, formatarFaixa } from '../utils/formatacao';
import { Cartao } from './Cartao';
import { Selo, TomSelo } from './Selo';
import { seloStatusPedido, seloUrgencia } from './selos';

/** Próximo passo mostrado no cartão (ex.: "3 orçamentos recebidos", "Avalie o prestador"). */
export interface ProximoPasso {
  texto: string;
  icone: keyof typeof Ionicons.glyphMap;
  destaque?: boolean;
}

interface Props {
  pedido: Solicitacao;
  aoPressionar: () => void;
  /** Selo calculado com a contratação (cliente); sem ele vale o status do pedido. */
  situacao?: { texto: string; tom: TomSelo };
  proximoPasso?: ProximoPasso;
  /** Valor combinado (substitui a faixa de referência depois da contratação). */
  valorCombinado?: string;
  /** Linhas extras com ícone (ex.: distância e fotos, na visão do prestador). */
  detalhes?: { icone: keyof typeof Ionicons.glyphMap; texto: string }[];
}

export function CartaoPedido({
  pedido,
  aoPressionar,
  situacao,
  proximoPasso,
  valorCombinado,
  detalhes,
}: Props) {
  const status = situacao ?? seloStatusPedido[pedido.status];
  const urgencia = seloUrgencia[pedido.urgencia];

  return (
    <Cartao aoPressionar={aoPressionar}>
      <View style={estilos.linha}>
        <Text style={estilos.categoria}>{pedido.categoria.nome}</Text>
        <Selo texto={status.texto} tom={status.tom} />
      </View>
      <Text style={estilos.descricao} numberOfLines={2}>
        {pedido.descricao}
      </Text>
      <View style={estilos.rodape}>
        <Selo texto={urgencia.texto} tom={urgencia.tom} />
        <View style={estilos.info}>
          <Ionicons name="location-outline" size={14} color={cores.textoSuave} />
          <Text style={estilos.textoInfo}>{pedido.bairro}</Text>
        </View>
      </View>
      {detalhes && detalhes.length > 0 && (
        <View style={estilos.detalhes}>
          {detalhes.map((d) => (
            <View key={d.texto} style={estilos.info}>
              <Ionicons name={d.icone} size={14} color={cores.secundaria} />
              <Text style={estilos.textoDetalhe}>{d.texto}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={estilos.rodape}>
        <Text style={estilos.preco}>
          {valorCombinado ?? formatarFaixa(pedido.precoMinimo, pedido.precoMaximo)}
        </Text>
        <Text style={estilos.textoInfo}>{formatarData(pedido.criadaEm)}</Text>
      </View>
      {proximoPasso && (
        <View style={[estilos.passo, proximoPasso.destaque && estilos.passoDestaque]}>
          <Ionicons
            name={proximoPasso.icone}
            size={16}
            color={proximoPasso.destaque ? cores.primariaEscura : cores.textoSuave}
          />
          <Text
            style={[estilos.passoTexto, proximoPasso.destaque && estilos.passoTextoDestaque]}
            numberOfLines={2}
          >
            {proximoPasso.texto}
          </Text>
          {proximoPasso.destaque && (
            <Ionicons name="chevron-forward" size={16} color={cores.primariaEscura} />
          )}
        </View>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacos.sm,
  },
  categoria: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
    flexShrink: 1,
  },
  descricao: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginVertical: espacos.sm,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espacos.xs,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  textoInfo: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  detalhes: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.md, marginTop: espacos.sm },
  textoDetalhe: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.secundaria },
  passo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    marginTop: espacos.sm,
    paddingTop: espacos.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  passoDestaque: {
    backgroundColor: cores.primariaClara,
    borderTopWidth: 0,
    borderRadius: 10,
    padding: espacos.sm,
  },
  passoTexto: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
  },
  passoTextoDestaque: { fontFamily: fontes.seminegrito, color: cores.primariaEscura },
  preco: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.primariaEscura },
});
