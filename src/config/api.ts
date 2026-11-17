import Constants from 'expo-constants';

/**
 * Enderecos das duas APIs do Bico Certo.
 * - Build publicado: definidos por EXPO_PUBLIC_JAVA_API_URL e EXPO_PUBLIC_NET_API_URL (eas.json).
 * - Desenvolvimento no Expo Go: usa o IP do computador que esta rodando o Metro,
 *   assim o celular na mesma rede Wi-Fi alcanca as APIs locais.
 */
function hostDoComputador(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : 'localhost';
}

export const JAVA_API_URL =
  process.env.EXPO_PUBLIC_JAVA_API_URL ?? `http://${hostDoComputador()}:8080`;

export const NET_API_URL =
  process.env.EXPO_PUBLIC_NET_API_URL ?? `http://${hostDoComputador()}:5090`;

/** 60 s: no plano gratuito do Render a primeira chamada depois de um tempo parado demora cerca de 1 minuto. */
export const TEMPO_LIMITE_MS = 60000;
