import AsyncStorage from '@react-native-async-storage/async-storage';

import { Sessao } from '../models/usuario';

const CHAVE = '@bicocerto:sessao';

export async function salvarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(sessao));
}

/** Devolve a sessao salva apenas se o token ainda nao expirou. */
export async function carregarSessao(): Promise<Sessao | null> {
  const texto = await AsyncStorage.getItem(CHAVE);
  if (!texto) return null;
  const sessao = JSON.parse(texto) as Sessao;
  if (sessao.expiraEm <= Date.now()) {
    await AsyncStorage.removeItem(CHAVE);
    return null;
  }
  return sessao;
}

export async function apagarSessao(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE);
}
