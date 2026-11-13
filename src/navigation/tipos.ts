import { NavigatorScreenParams } from '@react-navigation/native';

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
  Sobre: undefined;
};

export type PrestadorAbasParams = {
  PedidosAbertos: undefined;
  Agenda: undefined;
  Avisos: undefined;
  Perfil: undefined;
};

export type PrestadorStackParams = {
  PrestadorAbas: NavigatorScreenParams<PrestadorAbasParams>;
  DetalheServico: { id: number };
  Sobre: undefined;
};
