import { Contratacao, ContratacaoRequest, Orcamento, OrcamentoRequest, StatusContratacao } from '../models/contratacao';
import { Pagina } from '../models/pagina';
import { apiNet } from './httpClient';

/**
 * Operacoes de escrita da API .NET exigem o header Idempotency-Key: se a internet falhar e o app reenviar
 * com a MESMA chave, a operacao nao e duplicada no servidor.
 */
function comChave(chave: string) {
  return { headers: { 'Idempotency-Key': chave } };
}

export async function enviarOrcamento(dados: OrcamentoRequest, chave: string): Promise<Orcamento> {
  const { data } = await apiNet.post<Orcamento>('/api/orcamentos', dados, comChave(chave));
  return data;
}

export async function listarOrcamentos(solicitacaoId?: number): Promise<Pagina<Orcamento>> {
  const { data } = await apiNet.get<Pagina<Orcamento>>('/api/orcamentos', {
    params: { solicitacaoId, tamanho: 50 },
  });
  return data;
}

export async function aceitarOrcamento(dados: ContratacaoRequest, chave: string): Promise<Contratacao> {
  const { data } = await apiNet.post<Contratacao>('/api/contratacoes', dados, comChave(chave));
  return data;
}

export async function listarContratacoes(): Promise<Pagina<Contratacao>> {
  const { data } = await apiNet.get<Pagina<Contratacao>>('/api/contratacoes', {
    params: { tamanho: 50 },
  });
  return data;
}

export async function alterarStatusContratacao(id: number, status: StatusContratacao): Promise<Contratacao> {
  const { data } = await apiNet.patch<Contratacao>(`/api/contratacoes/${id}/status`, { status });
  return data;
}
