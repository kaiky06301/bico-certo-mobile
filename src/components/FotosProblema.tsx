import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

export const MAXIMO_FOTOS = 3;
const TAMANHO_MAXIMO = 3_000_000; // caracteres em base64 (~2 MB), mesmo limite da API

/** Foto escolhida: `uri` para mostrar na tela e `dados` (data URI base64) para enviar à API. */
export interface FotoEscolhida {
  uri: string;
  dados: string;
}

interface Props {
  fotos: FotoEscolhida[];
  aoMudar: (fotos: FotoEscolhida[]) => void;
}

const opcoesDeFoto: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.3, // foto menor = envio rápido no 4G
  base64: true,
};

function converter(assets: ImagePicker.ImagePickerAsset[]): FotoEscolhida[] {
  const validas: FotoEscolhida[] = [];
  for (const asset of assets) {
    if (!asset.base64) continue;
    const tipo = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const dados = `data:${tipo};base64,${asset.base64}`;
    if (dados.length > TAMANHO_MAXIMO) {
      Alert.alert('Foto muito grande', 'Escolha outra foto ou tire uma nova.');
      continue;
    }
    validas.push({ uri: asset.uri, dados });
  }
  return validas;
}

/** "Fotos do problema (opcional)": até 3 fotos pela câmera ou pela galeria. */
export function FotosProblema({ fotos, aoMudar }: Props) {
  const restantes = MAXIMO_FOTOS - fotos.length;

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Sem acesso à câmera', 'Libere a câmera para o app nos Ajustes do celular.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync(opcoesDeFoto);
    if (!resultado.canceled)
      aoMudar([...fotos, ...converter(resultado.assets)].slice(0, MAXIMO_FOTOS));
  }

  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Sem acesso às fotos',
        'Libere o acesso às fotos para o app nos Ajustes do celular.',
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      ...opcoesDeFoto,
      allowsMultipleSelection: true,
      selectionLimit: restantes,
    });
    if (!resultado.canceled)
      aoMudar([...fotos, ...converter(resultado.assets)].slice(0, MAXIMO_FOTOS));
  }

  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>
        Fotos do problema <Text style={estilos.opcional}>(opcional)</Text>
      </Text>
      <Text style={estilos.ajuda}>
        Ajudam o prestador a entender o problema antes do orçamento.
      </Text>

      {fotos.length > 0 && (
        <View style={estilos.miniaturas}>
          {fotos.map((foto, i) => (
            <View key={foto.uri} style={estilos.miniatura}>
              <Image
                source={{ uri: foto.uri }}
                style={estilos.imagem}
                accessibilityLabel={`Foto ${i + 1}`}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover foto ${i + 1}`}
                hitSlop={8}
                onPress={() => aoMudar(fotos.filter((f) => f.uri !== foto.uri))}
                style={estilos.remover}
              >
                <Ionicons name="close" size={16} color={cores.branco} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {restantes > 0 ? (
        <View style={estilos.botoes}>
          <Pressable
            accessibilityRole="button"
            onPress={tirarFoto}
            style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="camera-outline" size={20} color={cores.secundaria} />
            <Text style={estilos.botaoTexto}>Tirar foto</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={escolherDaGaleria}
            style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="images-outline" size={20} color={cores.secundaria} />
            <Text style={estilos.botaoTexto}>Galeria</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={estilos.ajuda}>Limite de {MAXIMO_FOTOS} fotos atingido.</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginBottom: espacos.md },
  rotulo: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.texto },
  opcional: { fontFamily: fontes.regular, color: cores.textoSuave },
  ajuda: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: 2,
    marginBottom: espacos.sm,
  },
  miniaturas: { flexDirection: 'row', gap: espacos.sm, marginBottom: espacos.sm },
  miniatura: { width: 96, height: 96 },
  imagem: { width: 96, height: 96, borderRadius: raio.medio, backgroundColor: cores.borda },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30,42,68,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botoes: { flexDirection: 'row', gap: espacos.sm },
  botao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacos.xs,
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.secundaria,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
  },
  botaoTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.secundaria },
});
