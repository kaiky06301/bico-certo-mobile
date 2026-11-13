import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { cores } from '../theme/cores';
import { espacos } from '../theme/tipografia';

/** Tela com rolagem que sobe junto com o teclado (formularios). */
export function TelaFormulario({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.lg, paddingBottom: espacos.xl * 2 },
});
