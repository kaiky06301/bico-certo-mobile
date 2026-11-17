import { TomSelo } from '../components/Selo';
import { Contratacao, Orcamento } from '../models/contratacao';

/** Situação de um pedido do ponto de vista do prestador. */
export type SituacaoPrestador =
  | 'novo'
  | 'enviado'
  | 'negociacao'
  | 'suaVez'
  | 'contratado'
  | 'execucao'
  | 'concluido'
  | 'outroContratado'
  | 'recusado'
  | 'expirado';

export function situacaoDoPrestador(
  orcamento?: Orcamento,
  contratacao?: Contratacao,
): SituacaoPrestador {
  if (contratacao?.status === 'Concluida') return 'concluido';
  if (contratacao?.status === 'EmAndamento') return 'execucao';
  if (contratacao) return 'contratado';
  if (!orcamento) return 'novo';
  if (orcamento.status === 'Aceito') return 'contratado';
  if (orcamento.status === 'Recusado')
    return orcamento.clienteContratouOutro ? 'outroContratado' : 'recusado';
  if (orcamento.expirado) return 'expirado';
  if (orcamento.propostaPendente?.autor === 'Cliente') return 'suaVez';
  if (orcamento.propostaPendente) return 'negociacao';
  return 'enviado';
}

export const seloDoPrestador: Record<SituacaoPrestador, { texto: string; tom: TomSelo }> = {
  novo: { texto: 'Novo pedido', tom: 'sucesso' },
  enviado: { texto: 'Aguardando resposta', tom: 'primario' },
  negociacao: { texto: 'Em negociação', tom: 'alerta' },
  suaVez: { texto: 'Contraproposta do cliente', tom: 'alerta' },
  contratado: { texto: 'Você foi contratado', tom: 'sucesso' },
  execucao: { texto: 'Em execução', tom: 'alerta' },
  concluido: { texto: 'Concluído', tom: 'sucesso' },
  outroContratado: { texto: 'Contratado outro prestador', tom: 'neutro' },
  recusado: { texto: 'Recusado pelo cliente', tom: 'neutro' },
  expirado: { texto: 'Expirado', tom: 'perigo' },
};
