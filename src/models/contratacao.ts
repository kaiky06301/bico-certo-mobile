export type StatusOrcamento = 'Pendente' | 'Aceito' | 'Recusado';
export type StatusContratacao = 'Agendada' | 'EmAndamento' | 'Concluida' | 'Cancelada';

export interface Orcamento {
  id: number;
  solicitacaoId: number;
  clienteId: number;
  prestadorId: number;
  prestadorNome: string;
  prestadorEmail: string;
  /** Valor que vale agora (muda quando uma proposta da negociação é aceita). */
  valor: number;
  /** Valor que o prestador enviou no orçamento, antes da negociação. */
  valorInicial: number;
  /** Faixa de referência de preço da triagem (0 quando indisponível). */
  referenciaMinima: number;
  referenciaMaxima: number;
  posicaoNaFaixa: PosicaoNaFaixa;
  prazoDias: number;
  observacao: string | null;
  status: StatusOrcamento;
  criadoEm: string;
  atualizadoEm: string;
  /** Proposta da negociação esperando resposta (null quando não há). */
  propostaPendente: Proposta | null;
  /** O pedido já tem contratação ativa com outro prestador (explica o "Recusado"). */
  clienteContratouOutro: boolean;
}

export type PosicaoNaFaixa = 'Abaixo' | 'Dentro' | 'Acima' | 'SemReferencia';

export type AutorProposta = 'Cliente' | 'Prestador';
export type StatusProposta = 'Pendente' | 'Aceita' | 'Recusada' | 'Substituida';

/** Uma rodada da negociação de valor entre cliente e prestador. */
export interface Proposta {
  id: number;
  orcamentoId: number;
  autor: AutorProposta;
  autorId: number;
  autorNome: string;
  valor: number;
  comentario: string | null;
  status: StatusProposta;
  criadaEm: string;
  respondidaEm: string | null;
}

export interface PropostaRequest {
  valor: number;
  comentario?: string;
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
