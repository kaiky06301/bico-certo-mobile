import { StatusContratacao, StatusOrcamento } from '../models/contratacao';
import { StatusSolicitacao, Urgencia } from '../models/solicitacao';
import { TomSelo } from './Selo';

/** Traduz os status das APIs para texto e cor dos selos. */
export const seloStatusPedido: Record<StatusSolicitacao, { texto: string; tom: TomSelo }> = {
  ABERTA: { texto: 'Aguardando prestador', tom: 'primario' },
  EM_ATENDIMENTO: { texto: 'Em atendimento', tom: 'alerta' },
  CONCLUIDA: { texto: 'Concluído', tom: 'sucesso' },
  CANCELADA: { texto: 'Cancelado', tom: 'neutro' },
};

export const seloUrgencia: Record<Urgencia, { texto: string; tom: TomSelo }> = {
  BAIXA: { texto: 'Urgência baixa', tom: 'neutro' },
  MEDIA: { texto: 'Urgência média', tom: 'alerta' },
  ALTA: { texto: 'Urgência alta', tom: 'perigo' },
};

export const seloOrcamento: Record<StatusOrcamento, { texto: string; tom: TomSelo }> = {
  Pendente: { texto: 'Aguardando resposta', tom: 'primario' },
  Aceito: { texto: 'Aceito', tom: 'sucesso' },
  Recusado: { texto: 'Recusado', tom: 'neutro' },
};

export const seloContratacao: Record<StatusContratacao, { texto: string; tom: TomSelo }> = {
  Agendada: { texto: 'Agendada', tom: 'primario' },
  EmAndamento: { texto: 'Em andamento', tom: 'alerta' },
  Concluida: { texto: 'Concluída', tom: 'sucesso' },
  Cancelada: { texto: 'Cancelada', tom: 'neutro' },
};
