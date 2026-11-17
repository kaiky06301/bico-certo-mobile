import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';

interface Props {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
  aoPressionar?: () => void;
  perigo?: boolean;
  /** Conteúdo à direita no lugar da seta (ex.: um Switch). */
  direita?: ReactNode;
}

/** Linha de menu do perfil: ícone, texto e seta (área de toque de 56 px). */
export function ItemMenu({ icone, titulo, descricao, aoPressionar, perigo, direita }: Props) {
  const cor = perigo ? cores.perigo : cores.secundaria;
  return (
    <Pressable
      accessibilityRole={aoPressionar ? 'button' : undefined}
      accessibilityLabel={titulo}
      onPress={aoPressionar}
      disabled={!aoPressionar}
      style={({ pressed }) => [estilos.linha, pressed && estilos.pressionado]}
    >
      <Ionicons name={icone} size={22} color={cor} />
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, perigo && { color: cores.perigo }]}>{titulo}</Text>
        {!!descricao && <Text style={estilos.descricao}>{descricao}</Text>}
      </View>
      {direita ??
        (aoPressionar && <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />)}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.md,
    minHeight: 56,
    paddingVertical: espacos.sm,
  },
  pressionado: { opacity: 0.6 },
  textos: { flex: 1 },
  titulo: { fontFamily: fontes.media, fontSize: tamanhos.medio, color: cores.texto },
  descricao: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
