import { CadastroRequest, LoginRequest, LoginResponse, Usuario } from '../models/usuario';
import { apiJava } from './httpClient';

export async function entrar(dados: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiJava.post<LoginResponse>('/auth/login', dados);
  return data;
}

export async function cadastrar(dados: CadastroRequest): Promise<Usuario> {
  const { data } = await apiJava.post<Usuario>('/auth/registrar', dados);
  return data;
}
