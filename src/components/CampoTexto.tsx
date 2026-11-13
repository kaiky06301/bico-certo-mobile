import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string;
}

export function CampoTexto({ rotulo, erro, multiline, style, ...props }: Props) {
  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        multiline={multiline}
        style={[estilos.campo, multiline && estilos.multilinha, !!erro && estilos.campoErro, style]}
        {...props}
      />
      {!!erro && <Text style={estilos.erro}>{erro}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginBottom: espacos.md },
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.xs,
  },
  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    paddingHorizontal: espacos.md,
    fontFamily: fontes.regular,
    fontSize: tamanhos.medio,
    color: cores.texto,
  },
  multilinha: { minHeight: 110, paddingTop: espacos.sm, textAlignVertical: 'top' },
  campoErro: { borderColor: cores.perigo },
  erro: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.perigo,
    marginTop: espacos.xs,
  },
});
