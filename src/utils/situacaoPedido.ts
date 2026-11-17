import { TomSelo } from '../components/Selo';
import { Contratacao, Orcamento } from '../models/contratacao';
import { Solicitacao } from '../models/solicitacao';

/**
 * Etapa do pedido do ponto de vista do cliente. Junta o status da API Java (pedido)
 * com a contratação da API .NET para mostrar a mesma tela com conteúdo diferente.
 */
export type EtapaPedido = 'orcamentos' | 'contratado' | 'execucao' | 'concluido' | 'cancelado';

export function etapaDoPedido(p: Solicitacao, contratacao?: Contratacao): EtapaPedido {
  if (p.status === 'CANCELADA') return 'cancelado';
  if (p.status === 'CONCLUIDA') return 'concluido';
  if (contratacao?.status === 'EmAndamento') return 'execucao';
  if (contratacao || p.status === 'EM_ATENDIMENTO') return 'contratado';
  return 'orcamentos';
}

export function seloDaEtapa(
  etapa: EtapaPedido,
  orcamentosPendentes: number,
): { texto: string; tom: TomSelo } {
  switch (etapa) {
    case 'orcamentos':
      return orcamentosPendentes > 0
        ? {
            texto: `${orcamentosPendentes} ${orcamentosPendentes === 1 ? 'orçamento' : 'orçamentos'}`,
            tom: 'primario',
          }
        : { texto: 'Aguardando orçamentos', tom: 'neutro' };
    case 'contratado':
      return { texto: 'Contratado', tom: 'alerta' };
    case 'execucao':
      return { texto: 'Em execução', tom: 'alerta' };
    case 'concluido':
      return { texto: 'Concluído', tom: 'sucesso' };
    case 'cancelado':
      return { texto: 'Cancelado', tom: 'neutro' };
  }
}

/** Contratação ativa (ou concluída) do pedido, se houver. */
export function contratacaoDoPedido(
  pedidoId: number,
  contratacoes: Contratacao[] | undefined,
): Contratacao | undefined {
  return contratacoes?.find((c) => c.solicitacaoId === pedidoId && c.status !== 'Cancelada');
}

export function orcamentosDoPedido(pedidoId: number, orcamentos: Orcamento[] | undefined) {
  return (orcamentos ?? []).filter((o) => o.solicitacaoId === pedidoId);
}
