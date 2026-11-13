import { Categoria } from '../models/solicitacao';
import { Pagina } from '../models/pagina';
import { apiJava } from './httpClient';

/** Categorias sao publicas so para usuarios logados; no cadastro usamos a lista fixa do seed. */
export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await apiJava.get<Pagina<Categoria>>('/api/categorias', {
    params: { size: 50, sort: 'nome,asc' },
  });
  return data.conteudo;
}
