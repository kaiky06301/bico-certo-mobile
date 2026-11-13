import axios, { AxiosInstance } from 'axios';

import { JAVA_API_URL, NET_API_URL, TEMPO_LIMITE_MS } from '../config/api';

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

/** Chamado pelo AuthContext ao entrar/sair: o token passa a ir em todas as requisicoes. */
export function definirToken(token: string | null) {
  tokenAtual = token;
}

/** Chamado pelo AuthContext: quando a API responde 401, a sessao e encerrada. */
export function definirAcaoSessaoExpirada(acao: (() => void) | null) {
  aoExpirarSessao = acao;
}

function criarCliente(baseURL: string): AxiosInstance {
  const cliente = axios.create({
    baseURL,
    timeout: TEMPO_LIMITE_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  cliente.interceptors.request.use((config) => {
    if (tokenAtual) {
      config.headers.Authorization = `Bearer ${tokenAtual}`;
    }
    return config;
  });

  cliente.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
      const rotaDeLogin = String(erro.config?.url ?? '').includes('/auth/login');
      if (erro.response?.status === 401 && tokenAtual && !rotaDeLogin) {
        aoExpirarSessao?.();
      }
      return Promise.reject(erro);
    },
  );

  return cliente;
}

/** API Java: usuarios, pedidos, triagem com IA, prestadores e notificacoes. */
export const apiJava = criarCliente(JAVA_API_URL);

/** API .NET: orcamentos e contratacoes. */
export const apiNet = criarCliente(NET_API_URL);
