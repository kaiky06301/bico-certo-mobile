import { StyleSheet, Text } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';

export function Titulo({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={estilos.titulo}>
      {children}
    </Text>
  );
}

export function Subtitulo({ children }: { children: string }) {
  return <Text style={estilos.subtitulo}>{children}</Text>;
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.grande,
    color: cores.texto,
    marginTop: espacos.md,
    marginBottom: espacos.sm,
  },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.md,
  },
});
