import { NavigatorScreenParams } from '@react-navigation/native';

/** Telas do perfil que existem para os dois papéis. */
type TelasDaConta = {
  Sobre: undefined;
  DadosPessoais: undefined;
  AlterarSenha: undefined;
  ExcluirConta: undefined;
  TextoLegal: { tipo: 'termos' | 'privacidade' };
  PerfilPrestador: { usuarioId: number };
  MeusEnderecos: undefined;
  EnderecoForm: { id?: number };
};

export type AuthStackParams = {
  Login: undefined;
  Cadastro: undefined;
};

export type ClienteAbasParams = {
  NovoPedido: undefined;
  MeusPedidos: undefined;
  Avisos: undefined;
  Perfil: undefined;
};

export type ClienteStackParams = {
  ClienteAbas: NavigatorScreenParams<ClienteAbasParams>;
  DetalhePedido: { id: number };
  EditarPedido: { id: number };
  PropostaOrcamento: { solicitacaoId: number; orcamentoId: number };
  MinhasAvaliacoes: undefined;
} & TelasDaConta;

export type PrestadorAbasParams = {
  PedidosAbertos: undefined;
  Agenda: undefined;
  Avisos: undefined;
  Perfil: undefined;
};

export type PrestadorStackParams = {
  PrestadorAbas: NavigatorScreenParams<PrestadorAbasParams>;
  DetalheServico: { id: number };
  PerfilProfissional: undefined;
} & TelasDaConta;
