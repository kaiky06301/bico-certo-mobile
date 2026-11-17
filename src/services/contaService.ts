import { Pagina } from '../models/pagina';
import { Avaliacao } from '../models/solicitacao';
import {
  AlterarSenhaRequest,
  ContaRequest,
  Endereco,
  EnderecoRequest,
  FotoTrabalho,
  PerfilPrestador,
  PerfilPrestadorRequest,
  Usuario,
} from '../models/usuario';
import { apiJava } from './httpClient';

// ---------- minha conta (cliente e prestador) ----------

export async function buscarConta(): Promise<Usuario> {
  const { data } = await apiJava.get<Usuario>('/api/conta');
  return data;
}

export async function atualizarConta(dados: ContaRequest): Promise<Usuario> {
  const { data } = await apiJava.put<Usuario>('/api/conta', dados);
  return data;
}

export async function alterarSenha(dados: AlterarSenhaRequest): Promise<void> {
  await apiJava.put('/api/conta/senha', dados);
}

/** Pede a senha de novo: os dados pessoais são apagados e o acesso é encerrado. */
export async function excluirConta(senha: string): Promise<void> {
  await apiJava.delete('/api/conta', { data: { senha } });
}

/** Avaliações que o cliente fez dos prestadores. */
export async function listarMinhasAvaliacoes(): Promise<Pagina<Avaliacao>> {
  const { data } = await apiJava.get<Pagina<Avaliacao>>('/api/conta/avaliacoes');
  return data;
}

// ---------- perfil profissional do prestador ----------

export async function buscarMeuPerfilPrestador(): Promise<PerfilPrestador> {
  const { data } = await apiJava.get<PerfilPrestador>('/api/prestadores/me');
  return data;
}

export async function atualizarMeuPerfilPrestador(
  dados: PerfilPrestadorRequest,
): Promise<PerfilPrestador> {
  const { data } = await apiJava.put<PerfilPrestador>('/api/prestadores/me', dados);
  return data;
}

/** Foto de perfil do prestador (data URI JPEG/PNG); null remove a foto. */
export async function definirFotoDePerfil(imagem: string | null): Promise<PerfilPrestador> {
  const { data } = imagem
    ? await apiJava.put<PerfilPrestador>('/api/prestadores/me/foto', { imagem })
    : await apiJava.delete<PerfilPrestador>('/api/prestadores/me/foto');
  return data;
}

/** Galeria de trabalhos realizados (pública). */
export async function listarGaleria(prestadorId: number): Promise<FotoTrabalho[]> {
  const { data } = await apiJava.get<FotoTrabalho[]>(`/api/prestadores/${prestadorId}/fotos`);
  return data;
}

export async function adicionarFotoNaGaleria(
  imagem: string,
  legenda?: string,
): Promise<FotoTrabalho> {
  const { data } = await apiJava.post<FotoTrabalho>('/api/prestadores/me/fotos', {
    imagem,
    legenda,
  });
  return data;
}

export async function removerFotoDaGaleria(fotoId: number): Promise<void> {
  await apiJava.delete(`/api/prestadores/me/fotos/${fotoId}`);
}

/** A API .NET guarda o id do usuário do prestador; o perfil público é buscado por ele. */
export async function buscarPerfilPrestadorPorUsuario(usuarioId: number): Promise<PerfilPrestador> {
  const { data } = await apiJava.get<PerfilPrestador>(`/api/prestadores/usuario/${usuarioId}`);
  return data;
}

export async function listarAvaliacoesDoPrestador(prestadorId: number): Promise<Pagina<Avaliacao>> {
  const { data } = await apiJava.get<Pagina<Avaliacao>>(
    `/api/prestadores/${prestadorId}/avaliacoes`,
    { params: { size: 20 } },
  );
  return data;
}

// ---------- meus endereços ----------

export async function listarEnderecos(): Promise<Endereco[]> {
  const { data } = await apiJava.get<Endereco[]>('/api/conta/enderecos');
  return data;
}

export async function criarEndereco(dados: EnderecoRequest): Promise<Endereco> {
  const { data } = await apiJava.post<Endereco>('/api/conta/enderecos', dados);
  return data;
}

export async function atualizarEndereco(id: number, dados: EnderecoRequest): Promise<Endereco> {
  const { data } = await apiJava.put<Endereco>(`/api/conta/enderecos/${id}`, dados);
  return data;
}

export async function tornarPrincipal(id: number): Promise<Endereco> {
  const { data } = await apiJava.patch<Endereco>(`/api/conta/enderecos/${id}/principal`);
  return data;
}

export async function excluirEndereco(id: number): Promise<void> {
  await apiJava.delete(`/api/conta/enderecos/${id}`);
}
