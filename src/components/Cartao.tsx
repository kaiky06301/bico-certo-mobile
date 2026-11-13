import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, raio } from '../theme/tipografia';

interface Props {
  children: ReactNode;
  aoPressionar?: () => void;
  estilo?: ViewStyle;
}

export function Cartao({ children, aoPressionar, estilo }: Props) {
  if (!aoPressionar) {
    return <View style={[estilos.cartao, estilo]}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado, estilo]}
    >
      {children}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espacos.md,
    marginBottom: espacos.md,
    borderWidth: 1,
    borderColor: cores.borda,
    shadowColor: cores.secundaria,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressionado: { opacity: 0.9 },
});
