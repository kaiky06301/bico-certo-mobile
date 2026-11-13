export type StatusOrcamento = 'Pendente' | 'Aceito' | 'Recusado';
export type StatusContratacao = 'Agendada' | 'EmAndamento' | 'Concluida' | 'Cancelada';

export interface Orcamento {
  id: number;
  solicitacaoId: number;
  clienteId: number;
  prestadorId: number;
  prestadorEmail: string;
  valor: number;
  prazoDias: number;
  observacao: string | null;
  status: StatusOrcamento;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrcamentoRequest {
  solicitacaoId: number;
  valor: number;
  prazoDias: number;
  observacao?: string;
}

export interface Contratacao {
  id: number;
  orcamentoId: number;
  solicitacaoId: number;
  clienteId: number;
  prestadorId: number;
  valorAcordado: number;
  dataAgendada: string;
  status: StatusContratacao;
  criadaEm: string;
  atualizadaEm: string;
}

export interface ContratacaoRequest {
  orcamentoId: number;
  dataAgendada: string;
}
