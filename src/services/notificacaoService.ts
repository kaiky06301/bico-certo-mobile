import { Pagina } from '../models/pagina';
import { Notificacao } from '../models/solicitacao';
import { apiJava } from './httpClient';

export async function listarNotificacoes(): Promise<Pagina<Notificacao>> {
  const { data } = await apiJava.get<Pagina<Notificacao>>('/api/notificacoes', {
    params: { size: 30 },
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
