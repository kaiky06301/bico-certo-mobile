import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CadastroRequest, LoginRequest, Sessao, Usuario } from '../models/usuario';
import * as authService from '../services/authService';
import { definirAcaoSessaoExpirada, definirToken } from '../services/httpClient';
import { apagarSessao, carregarSessao, salvarSessao } from '../services/sessaoStorage';

interface AuthContextValor {
  usuario: Usuario | null;
  carregandoSessao: boolean;
  entrar: (dados: LoginRequest) => Promise<void>;
  cadastrar: (dados: CadastroRequest) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const queryClient = useQueryClient();

  const sair = useCallback(async () => {
    definirToken(null);
    setUsuario(null);
    queryClient.clear();
    await apagarSessao();
  }, [queryClient]);

  // Restaura a sessao salva ao abrir o app
  useEffect(() => {
    carregarSessao()
      .then((sessao) => {
        if (sessao) {
          definirToken(sessao.token);
          setUsuario(sessao.usuario);
        }
      })
      .finally(() => setCarregandoSessao(false));
  }, []);

  // Token expirado ou invalido (401) encerra a sessao e volta para o login
  useEffect(() => {
    definirAcaoSessaoExpirada(() => {
      sair();
    });
    return () => definirAcaoSessaoExpirada(null);
  }, [sair]);

  const entrar = useCallback(async (dados: LoginRequest) => {
    const resposta = await authService.entrar(dados);
    const sessao: Sessao = {
      token: resposta.accessToken,
      expiraEm: Date.now() + resposta.expiresIn,
      usuario: resposta.usuario,
    };
    definirToken(sessao.token);
    await salvarSessao(sessao);
    setUsuario(sessao.usuario);
  }, []);

  const cadastrar = useCallback(
    async (dados: CadastroRequest) => {
      await authService.cadastrar(dados);
      await entrar({ email: dados.email, senha: dados.senha });
    },
    [entrar],
  );

  const valor = useMemo(
    () => ({ usuario, carregandoSessao, entrar, cadastrar, sair }),
    [usuario, carregandoSessao, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return contexto;
}
