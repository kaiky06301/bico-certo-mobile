import { Image, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { fontes } from '../theme/tipografia';

interface Props {
  nome: string;
  tamanho?: number;
  /** Foto de perfil (data URI); sem foto mostra as iniciais. */
  foto?: string | null;
}

/** Foto de perfil ou as iniciais do nome (ex.: "Maria Souza" -> "MS"). */
export function Avatar({ nome, tamanho = 72, foto }: Props) {
  const forma = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        accessibilityLabel={`Foto de ${nome}`}
        style={[estilos.avatar, forma]}
      />
    );
  }
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
  return (
    <View accessibilityLabel={`Foto de ${nome}`} style={[estilos.avatar, forma]}>
      <Text style={[estilos.iniciais, { fontSize: tamanho * 0.38 }]}>{iniciais}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  avatar: { backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  iniciais: { fontFamily: fontes.negrito, color: cores.branco },
});
