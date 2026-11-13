import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos } from '../theme/tipografia';

interface Props {
  nota: number;
  aoMudar: (nota: number) => void;
}

export function Estrelas({ nota, aoMudar }: Props) {
  return (
    <View
      style={estilos.linha}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 1, max: 5, now: nota }}
    >
      {[1, 2, 3, 4, 5].map((valor) => (
        <Pressable
          key={valor}
          accessibilityLabel={`${valor} estrela${valor > 1 ? 's' : ''}`}
          onPress={() => aoMudar(valor)}
          hitSlop={8}
        >
          <Ionicons name={valor <= nota ? 'star' : 'star-outline'} size={36} color={cores.alerta} />
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: espacos.sm,
    justifyContent: 'center',
    marginVertical: espacos.md,
  },
});
