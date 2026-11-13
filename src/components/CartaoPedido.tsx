import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Solicitacao } from '../models/solicitacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarData, formatarFaixa } from '../utils/formatacao';
import { Cartao } from './Cartao';
import { Selo } from './Selo';
import { seloStatusPedido, seloUrgencia } from './selos';

interface Props {
  pedido: Solicitacao;
  aoPressionar: () => void;
}

export function CartaoPedido({ pedido, aoPressionar }: Props) {
  const status = seloStatusPedido[pedido.status];
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
      <View style={estilos.rodape}>
        <Text style={estilos.preco}>{formatarFaixa(pedido.precoMinimo, pedido.precoMaximo)}</Text>
        <Text style={estilos.textoInfo}>{formatarData(pedido.criadaEm)}</Text>
      </View>
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
  preco: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.primariaEscura },
});
