export type Papel = 'CLIENTE' | 'PRESTADOR' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  bairro: string;
  papel: Papel;
}

export interface Sessao {
  token: string;
  expiraEm: number;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  bairro: string;
  papel: Exclude<Papel, 'ADMIN'>;
  categoriaId?: number;
  descricaoServicos?: string;
}
