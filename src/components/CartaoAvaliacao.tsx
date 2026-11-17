import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avaliacao } from '../models/solicitacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarData } from '../utils/formatacao';
import { Cartao } from './Cartao';

/** Uma avaliação: estrelas, comentário e quem avaliou (ou quem foi avaliado). */
export function CartaoAvaliacao({ avaliacao, titulo }: { avaliacao: Avaliacao; titulo: string }) {
  return (
    <Cartao>
      <View style={estilos.topo}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.data}>{formatarData(avaliacao.criadaEm)}</Text>
      </View>
      <View style={estilos.estrelas} accessibilityLabel={`${avaliacao.nota} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons
            key={n}
            name={n <= avaliacao.nota ? 'star' : 'star-outline'}
            size={16}
            color={cores.alerta}
          />
        ))}
      </View>
      {!!avaliacao.comentario && <Text style={estilos.comentario}>{avaliacao.comentario}</Text>}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', gap: espacos.sm },
  titulo: {
    flex: 1,
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.texto,
  },
  data: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  estrelas: { flexDirection: 'row', gap: 2, marginVertical: espacos.xs },
  comentario: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
});
