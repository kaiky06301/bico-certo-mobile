import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { Botao } from './Botao';

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={cores.primaria} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

export function MensagemErro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name="cloud-offline-outline" size={48} color={cores.perigo} />
      <Text style={estilos.texto}>{mensagem}</Text>
      {aoTentarDeNovo && (
        <Botao titulo="Tentar de novo" variante="contorno" aoPressionar={aoTentarDeNovo} estilo={estilos.botao} />
      )}
    </View>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  texto,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}) {
  return (
    <View style={estilos.centro}>
      <Ionicons name={icone} size={56} color={cores.primaria} />
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacos.xl, gap: espacos.sm },
  titulo: { fontFamily: fontes.seminegrito, fontSize: tamanhos.grande, color: cores.texto, textAlign: 'center' },
  texto: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave, textAlign: 'center' },
  botao: { marginTop: espacos.md, alignSelf: 'stretch' },
});
