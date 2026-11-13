import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

type Variante = 'primaria' | 'secundaria' | 'contorno' | 'perigo';

interface Props {
  titulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
}

export function Botao({ titulo, aoPressionar, variante = 'primaria', carregando, desabilitado, estilo }: Props) {
  const inativo = desabilitado || carregando;
  const corTexto = variante === 'contorno' ? cores.primaria : cores.branco;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      onPress={aoPressionar}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.base,
        estilos[variante],
        pressed && estilos.pressionado,
        inativo && estilos.inativo,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.texto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: raio.medio,
    paddingHorizontal: espacos.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaria: { backgroundColor: cores.primaria },
  secundaria: { backgroundColor: cores.secundaria },
  perigo: { backgroundColor: cores.perigo },
  contorno: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: cores.primaria },
  pressionado: { opacity: 0.85 },
  inativo: { opacity: 0.5 },
  texto: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio },
});
