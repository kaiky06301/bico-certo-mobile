import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

interface Opcao<T> {
  valor: T;
  rotulo: string;
}

interface Props<T> {
  opcoes: Opcao<T>[];
  selecionado: T | undefined;
  aoSelecionar: (valor: T) => void;
}

/** Grupo de "chips" selecionaveis (substitui o seletor nativo com visual da marca). */
export function Opcoes<T extends string | number>({ opcoes, selecionado, aoSelecionar }: Props<T>) {
  return (
    <View style={estilos.grupo} accessibilityRole="radiogroup">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === selecionado;
        return (
          <Pressable
            key={String(opcao.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativo }}
            onPress={() => aoSelecionar(opcao.valor)}
            style={[estilos.chip, ativo && estilos.chipAtivo]}
          >
            <Text style={[estilos.texto, ativo && estilos.textoAtivo]}>{opcao.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm, marginBottom: espacos.md },
  chip: {
    paddingHorizontal: espacos.md,
    paddingVertical: espacos.sm,
    borderRadius: raio.grande,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipAtivo: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  texto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.textoSuave },
  textoAtivo: { color: cores.primariaEscura },
});
