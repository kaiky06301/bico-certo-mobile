export type Papel = 'CLIENTE' | 'PRESTADOR' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  bairro: string;
  papel: Papel;
  criadoEm?: string;
}

/** Dados que o próprio usuário pode alterar em "Dados pessoais". */
export interface ContaRequest {
  nome: string;
  telefone?: string;
  bairro: string;
}

/** Endereço salvo em "Meus endereços" (casa, casa dos pais, trabalho...). */
export interface Endereco {
  id: number;
  apelido: string;
  logradouro: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export interface EnderecoRequest {
  apelido: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  principal?: boolean;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

/** Perfil profissional do prestador (o mesmo que o cliente vê antes de contratar). */
export interface PerfilPrestador {
  id: number;
  usuarioId: number;
  nome: string;
  bairro: string;
  categoria: { id: number; nome: string };
  descricao: string | null;
  regiaoAtendimento: string | null;
  disponibilidade: string | null;
  verificado: boolean;
  notaMedia: number;
  totalAvaliacoes: number;
  /** Serviços que o prestador já concluiu pelo Bico Certo. */
  servicosConcluidos: number;
  membroDesde: string;
  /** Outros serviços que ele também faz (além do principal). */
  outrasCategorias: { id: number; nome: string }[];
  /** Foto de perfil (data URI) ou null. */
  foto: string | null;
  anosExperiencia: number | null;
  especialidades: string | null;
  diferenciais: string | null;
  /** SEG, TER, QUA, QUI, SEX, SAB, DOM */
  diasAtendimento: DiaSemana[];
  horarioInicio: string | null;
  horarioFim: string | null;
  atendeEmergencia: boolean;
  /** Fotos na galeria de trabalhos realizados. */
  quantidadeFotos: number;
}

export type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';

/** Foto da galeria de trabalhos realizados. */
export interface FotoTrabalho {
  id: number;
  imagem: string;
  legenda: string | null;
  criadaEm: string;
}

export interface PerfilPrestadorRequest {
  categoriaId: number;
  descricao?: string;
  regiaoAtendimento?: string;
  disponibilidade?: string;
  bairro: string;
  telefone?: string;
  outrasCategoriaIds?: number[];
  anosExperiencia?: number;
  especialidades?: string;
  diferenciais?: string;
  diasAtendimento?: DiaSemana[];
  horarioInicio?: string;
  horarioFim?: string;
  atendeEmergencia?: boolean;
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
