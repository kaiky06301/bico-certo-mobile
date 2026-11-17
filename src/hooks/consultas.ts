import { useQuery } from '@tanstack/react-query';

import { listarCategorias } from '../services/categoriaService';
import {
  buscarConta,
  buscarMeuPerfilPrestador,
  buscarPerfilPrestadorPorUsuario,
  listarAvaliacoesDoPrestador,
  listarMinhasAvaliacoes,
} from '../services/contaService';
import { carregarPreferencias } from '../services/preferenciasStorage';
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
  conta: ['conta'] as const,
  minhasAvaliacoes: ['conta', 'avaliacoes'] as const,
  meuPerfilPrestador: ['prestadores', 'me'] as const,
  perfilPrestador: (usuarioId: number) => ['prestadores', 'usuario', usuarioId] as const,
  avaliacoesPrestador: (prestadorId: number) => ['prestadores', prestadorId, 'avaliacoes'] as const,
  preferencias: ['preferencias'] as const,
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

export function usePreferencias() {
  return useQuery({ queryKey: chaves.preferencias, queryFn: carregarPreferencias });
}

/** Contador do selo da aba de avisos: atualiza a cada 30 segundos, se as notificações estiverem ligadas. */
export function useNaoLidas() {
  const preferencias = usePreferencias();
  const ligadas = preferencias.data?.notificacoes ?? true;
  return useQuery({
    queryKey: chaves.naoLidas,
    queryFn: contarNaoLidas,
    refetchInterval: ligadas ? 30000 : false,
    enabled: ligadas,
  });
}

export function useConta() {
  return useQuery({ queryKey: chaves.conta, queryFn: buscarConta });
}

export function useMinhasAvaliacoes() {
  return useQuery({ queryKey: chaves.minhasAvaliacoes, queryFn: listarMinhasAvaliacoes });
}

export function useMeuPerfilPrestador(habilitado: boolean) {
  return useQuery({
    queryKey: chaves.meuPerfilPrestador,
    queryFn: buscarMeuPerfilPrestador,
    enabled: habilitado,
  });
}

export function usePerfilPrestador(usuarioId: number) {
  return useQuery({
    queryKey: chaves.perfilPrestador(usuarioId),
    queryFn: () => buscarPerfilPrestadorPorUsuario(usuarioId),
  });
}

export function useAvaliacoesPrestador(prestadorId: number | undefined) {
  return useQuery({
    queryKey: chaves.avaliacoesPrestador(prestadorId ?? 0),
    queryFn: () => listarAvaliacoesDoPrestador(prestadorId!),
    enabled: !!prestadorId,
  });
}
