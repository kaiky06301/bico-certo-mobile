import {
  Contratacao,
  ContratacaoRequest,
  Orcamento,
  OrcamentoRequest,
  Proposta,
  PropostaRequest,
  StatusContratacao,
} from '../models/contratacao';
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

/** Prestador retira (desiste de) um orçamento ainda pendente. */
export async function retirarOrcamento(id: number): Promise<void> {
  await apiNet.delete(`/api/orcamentos/${id}`);
}

export async function reagendarContratacao(id: number, dataAgendada: string): Promise<Contratacao> {
  const { data } = await apiNet.put<Contratacao>(`/api/contratacoes/${id}/agendamento`, {
    dataAgendada,
  });
  return data;
}

/** Cliente recusa um orçamento pendente do seu pedido. */
export async function recusarOrcamento(id: number): Promise<Orcamento> {
  const { data } = await apiNet.patch<Orcamento>(`/api/orcamentos/${id}/recusa`);
  return data;
}

export async function aceitarOrcamento(
  dados: ContratacaoRequest,
  chave: string,
): Promise<Contratacao> {
  const { data } = await apiNet.post<Contratacao>('/api/contratacoes', dados, comChave(chave));
  return data;
}

export async function listarContratacoes(): Promise<Pagina<Contratacao>> {
  const { data } = await apiNet.get<Pagina<Contratacao>>('/api/contratacoes', {
    params: { tamanho: 50 },
  });
  return data;
}

export async function alterarStatusContratacao(
  id: number,
  status: StatusContratacao,
): Promise<Contratacao> {
  const { data } = await apiNet.patch<Contratacao>(`/api/contratacoes/${id}/status`, { status });
  return data;
}

// ---------- negociação de valor ----------

export async function listarPropostas(orcamentoId: number): Promise<Proposta[]> {
  const { data } = await apiNet.get<Proposta[]>(`/api/orcamentos/${orcamentoId}/propostas`);
  return data;
}

/** Cliente ou prestador propõe outro valor; substitui a proposta que estava esperando resposta. */
export async function enviarProposta(
  orcamentoId: number,
  dados: PropostaRequest,
  chave: string,
): Promise<Proposta> {
  const { data } = await apiNet.post<Proposta>(
    `/api/orcamentos/${orcamentoId}/propostas`,
    dados,
    comChave(chave),
  );
  return data;
}

/** A outra parte aceita (o valor do orçamento muda) ou recusa (continua o valor atual). */
export async function responderProposta(
  orcamentoId: number,
  propostaId: number,
  aceita: boolean,
): Promise<Proposta> {
  const { data } = await apiNet.patch<Proposta>(
    `/api/orcamentos/${orcamentoId}/propostas/${propostaId}`,
    { aceita },
  );
  return data;
}
