import { Pagina } from '../models/pagina';
import { Notificacao } from '../models/solicitacao';
import { apiJava } from './httpClient';

export async function listarNotificacoes(): Promise<Pagina<Notificacao>> {
  const { data } = await apiJava.get<Pagina<Notificacao>>('/api/notificacoes', {
    params: { size: 50 },
  });
  return data;
}

export async function contarNaoLidas(): Promise<number> {
  const { data } = await apiJava.get<{ naoLidas: number }>('/api/notificacoes/nao-lidas');
  return data.naoLidas;
}

export async function marcarComoLida(id: number): Promise<Notificacao> {
  const { data } = await apiJava.patch<Notificacao>(`/api/notificacoes/${id}/lida`);
  return data;
}

export async function marcarTodasComoLidas(): Promise<void> {
  await apiJava.patch('/api/notificacoes/lidas');
}

export async function excluirNotificacao(id: number): Promise<void> {
  await apiJava.delete(`/api/notificacoes/${id}`);
}

/** Apaga só os avisos já lidos. */
export async function limparLidas(): Promise<void> {
  await apiJava.delete('/api/notificacoes/lidas');
}
