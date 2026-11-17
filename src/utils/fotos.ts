import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const TAMANHO_MAXIMO = 3_000_000; // caracteres em base64 (~2 MB), mesmo limite da API

/** Foto escolhida: `uri` para mostrar na tela e `dados` (data URI base64) para enviar à API. */
export interface FotoEscolhida {
  uri: string;
  dados: string;
}

export type OrigemFoto = 'camera' | 'galeria';

interface Opcoes {
  /** Quantas fotos podem ser escolhidas de uma vez na galeria. */
  limite?: number;
  /** Abre o corte quadrado (foto de perfil). */
  quadrada?: boolean;
}

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

/** Pede a permissão e abre a câmera ou a galeria. Devolve [] se a pessoa cancelar ou negar. */
export async function escolherFotos(
  origem: OrigemFoto,
  { limite = 1, quadrada = false }: Opcoes = {},
): Promise<FotoEscolhida[]> {
  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: quadrada ? 0.25 : 0.3, // foto menor = envio rápido no 4G
    base64: true,
    allowsEditing: quadrada,
    aspect: quadrada ? [1, 1] : undefined,
  };

  if (origem === 'camera') {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Sem acesso à câmera', 'Libere a câmera para o app nos Ajustes do celular.');
      return [];
    }
    const resultado = await ImagePicker.launchCameraAsync(opcoes);
    return resultado.canceled ? [] : converter(resultado.assets);
  }

  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    Alert.alert(
      'Sem acesso às fotos',
      'Libere o acesso às fotos para o app nos Ajustes do celular.',
    );
    return [];
  }
  const resultado = await ImagePicker.launchImageLibraryAsync({
    ...opcoes,
    allowsMultipleSelection: !quadrada && limite > 1,
    selectionLimit: limite,
  });
  return resultado.canceled ? [] : converter(resultado.assets);
}
