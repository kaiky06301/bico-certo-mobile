export type Urgencia = 'BAIXA' | 'MEDIA' | 'ALTA';
export type StatusSolicitacao = 'ABERTA' | 'EM_ATENDIMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type OrigemTriagem = 'IA' | 'REGRAS';

export interface CategoriaResumo {
  id: number;
  nome: string;
}

export interface Categoria extends CategoriaResumo {
  descricao: string;
  precoMinimo: number;
  precoMaximo: number;
}

export interface Contato {
  id: number;
  nome: string;
  telefone: string | null;
  notaMedia: number | null;
}

export interface Triagem {
  categoria: CategoriaResumo;
  urgencia: Urgencia;
  precoMinimo: number;
  precoMaximo: number;
  resumo: string;
  dicaSeguranca: string;
  origem: OrigemTriagem;
  prestadoresDisponiveis: number;
}

export interface Solicitacao {
  id: number;
  descricao: string;
  bairro: string;
  status: StatusSolicitacao;
  urgencia: Urgencia;
  categoria: CategoriaResumo;
  precoMinimo: number;
  precoMaximo: number;
  resumoTriagem: string;
  dicaSeguranca: string;
  origemTriagem: OrigemTriagem;
  cliente: Contato;
  prestador: Contato | null;
  criadaEm: string;
  atualizadaEm: string;
}

export interface SolicitacaoRequest {
  descricao: string;
  bairro?: string;
}

export interface Avaliacao {
  id: number;
  solicitacaoId: number;
  prestadorId: number;
  prestador: string;
  cliente: string;
  servico: string;
  nota: number;
  comentario: string | null;
  criadaEm: string;
}

export interface Notificacao {
  id: number;
  solicitacaoId: number;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
}

export interface Prestador {
  id: number;
  nome: string;
  bairro: string;
  categoria: CategoriaResumo;
  descricao: string | null;
  notaMedia: number;
  totalAvaliacoes: number;
}
