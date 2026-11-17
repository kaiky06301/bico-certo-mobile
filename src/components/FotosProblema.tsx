import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { escolherFotos, FotoEscolhida, OrigemFoto } from '../utils/fotos';

export type { FotoEscolhida };
export const MAXIMO_FOTOS = 3;

interface Props {
  fotos: FotoEscolhida[];
  aoMudar: (fotos: FotoEscolhida[]) => void;
}

/** "Fotos do problema (opcional)": até 3 fotos pela câmera ou pela galeria. */
export function FotosProblema({ fotos, aoMudar }: Props) {
  const restantes = MAXIMO_FOTOS - fotos.length;

  async function adicionar(origem: OrigemFoto) {
    const novas = await escolherFotos(origem, { limite: restantes });
    if (novas.length) aoMudar([...fotos, ...novas].slice(0, MAXIMO_FOTOS));
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
            onPress={() => void adicionar('camera')}
            style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="camera-outline" size={20} color={cores.secundaria} />
            <Text style={estilos.botaoTexto}>Tirar foto</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void adicionar('galeria')}
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
