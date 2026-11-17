import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@bicocerto:preferencias';

export interface Preferencias {
  /** Quando desligado, o app para de buscar avisos novos e esconde o selo da aba. */
  notificacoes: boolean;
}

const padrao: Preferencias = { notificacoes: true };

export async function carregarPreferencias(): Promise<Preferencias> {
  const texto = await AsyncStorage.getItem(CHAVE);
  return texto ? { ...padrao, ...(JSON.parse(texto) as Partial<Preferencias>) } : padrao;
}

export async function salvarPreferencias(preferencias: Preferencias): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(preferencias));
}
