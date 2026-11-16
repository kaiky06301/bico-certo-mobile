import { useQuery } from '@tanstack/react-query';

import { listarCategorias } from '../services/categoriaService';
import { contarNaoLidas, listarNotificacoes } from '../services/notificacaoService';
import {
  listarContratacoes,
  listarOrcamentos,
  listarPropostas,
} from '../services/orcamentoService';
import {
  buscarSolicitacao,
  listarMeusAtendimentos,
  listarMinhasSolicitacoes,
  listarSolicitacoesAbertas,
} from '../services/solicitacaoService';

/** Chaves do cache do React Query: usadas para atualizar as telas depois de cada alteracao. */
export const chaves = {
  categorias: ['categorias'] as const,
  minhasSolicitacoes: ['solicitacoes', 'minhas'] as const,
  abertas: ['solicitacoes', 'abertas'] as const,
  atendimentos: ['solicitacoes', 'atendimentos'] as const,
  solicitacao: (id: number) => ['solicitacoes', id] as const,
  orcamentos: (solicitacaoId?: number) => ['orcamentos', solicitacaoId ?? 'todos'] as const,
  propostas: (orcamentoId: number) => ['orcamentos', 'propostas', orcamentoId] as const,
  contratacoes: ['contratacoes'] as const,
  notificacoes: ['notificacoes'] as const,
  naoLidas: ['notificacoes', 'naoLidas'] as const,
};

export function useCategorias() {
  return useQuery({
    queryKey: chaves.categorias,
    queryFn: listarCategorias,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMinhasSolicitacoes() {
  return useQuery({
    queryKey: chaves.minhasSolicitacoes,
    queryFn: () => listarMinhasSolicitacoes(),
  });
}

export function useSolicitacoesAbertas() {
  return useQuery({ queryKey: chaves.abertas, queryFn: () => listarSolicitacoesAbertas() });
}

export function useMeusAtendimentos() {
  return useQuery({ queryKey: chaves.atendimentos, queryFn: () => listarMeusAtendimentos() });
}

export function useSolicitacao(id: number) {
  return useQuery({ queryKey: chaves.solicitacao(id), queryFn: () => buscarSolicitacao(id) });
}

export function useOrcamentos(solicitacaoId?: number) {
  return useQuery({
    queryKey: chaves.orcamentos(solicitacaoId),
    queryFn: () => listarOrcamentos(solicitacaoId),
  });
}

/** Histórico da negociação: só busca quando a pessoa abre o histórico. */
export function usePropostas(orcamentoId: number, habilitado: boolean) {
  return useQuery({
    queryKey: chaves.propostas(orcamentoId),
    queryFn: () => listarPropostas(orcamentoId),
    enabled: habilitado,
  });
}

export function useContratacoes() {
  return useQuery({ queryKey: chaves.contratacoes, queryFn: listarContratacoes });
}

export function useNotificacoes() {
  return useQuery({ queryKey: chaves.notificacoes, queryFn: listarNotificacoes });
}

/** Contador do selo da aba de avisos: atualiza sozinho a cada 30 segundos. */
export function useNaoLidas() {
  return useQuery({ queryKey: chaves.naoLidas, queryFn: contarNaoLidas, refetchInterval: 30000 });
}
