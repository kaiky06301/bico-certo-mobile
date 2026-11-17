import { Pagina } from '../models/pagina';
import { Avaliacao, Solicitacao, SolicitacaoRequest, Triagem } from '../models/solicitacao';
import { apiJava } from './httpClient';

const BASE = '/api/solicitacoes';

export async function simularTriagem(descricao: string): Promise<Triagem> {
  const { data } = await apiJava.post<Triagem>(`${BASE}/triagem`, { descricao });
  return data;
}

export async function criarSolicitacao(dados: SolicitacaoRequest): Promise<Solicitacao> {
  const { data } = await apiJava.post<Solicitacao>(BASE, dados);
  return data;
}

export async function listarMinhasSolicitacoes(pagina = 0): Promise<Pagina<Solicitacao>> {
  const { data } = await apiJava.get<Pagina<Solicitacao>>(`${BASE}/minhas`, {
    params: { page: pagina, size: 20 },
  });
  return data;
}

export async function listarSolicitacoesAbertas(pagina = 0): Promise<Pagina<Solicitacao>> {
  const { data } = await apiJava.get<Pagina<Solicitacao>>(`${BASE}/abertas`, {
    params: { page: pagina, size: 20 },
  });
  return data;
}

export async function listarMeusAtendimentos(pagina = 0): Promise<Pagina<Solicitacao>> {
  const { data } = await apiJava.get<Pagina<Solicitacao>>(`${BASE}/atendimentos`, {
    params: { page: pagina, size: 20 },
  });
  return data;
}

export async function buscarSolicitacao(id: number): Promise<Solicitacao> {
  const { data } = await apiJava.get<Solicitacao>(`${BASE}/${id}`);
  return data;
}

export async function atualizarSolicitacao(
  id: number,
  dados: SolicitacaoRequest,
): Promise<Solicitacao> {
  const { data } = await apiJava.put<Solicitacao>(`${BASE}/${id}`, dados);
  return data;
}

export async function cancelarSolicitacao(id: number): Promise<void> {
  await apiJava.delete(`${BASE}/${id}`);
}

export async function assumirSolicitacao(id: number): Promise<Solicitacao> {
  const { data } = await apiJava.patch<Solicitacao>(`${BASE}/${id}/assumir`);
  return data;
}

export async function concluirSolicitacao(id: number): Promise<Solicitacao> {
  const { data } = await apiJava.patch<Solicitacao>(`${BASE}/${id}/concluir`);
  return data;
}

export async function avaliarSolicitacao(
  id: number,
  nota: number,
  comentario?: string,
): Promise<Avaliacao> {
  const { data } = await apiJava.post<Avaliacao>(`${BASE}/${id}/avaliacao`, { nota, comentario });
  return data;
}

/**
 * Depois de aceitar o orçamento na API .NET, o cliente registra o prestador contratado na API Java:
 * o pedido passa para "em atendimento" e o prestador passa a ver o endereço completo e o telefone.
 */
export async function registrarContratacao(
  id: number,
  prestadorUsuarioId: number,
): Promise<Solicitacao> {
  const { data } = await apiJava.patch<Solicitacao>(`${BASE}/${id}/contratacao`, {
    prestadorUsuarioId,
  });
  return data;
}
