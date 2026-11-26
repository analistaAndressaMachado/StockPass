import { api } from './api';

export type Categoria = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  productCount: number;
};

export async function listarCategorias(activeOnly = false) {
  const { data } = await api.get<Categoria[]>('/categories', { params: activeOnly ? { activeOnly: true } : undefined });
  return data;
}

export async function criarCategoria(name: string, description: string) {
  const { data } = await api.post<Categoria>('/categories', { name, description });
  return data;
}

export async function atualizarCategoria(id: number, name: string, description: string) {
  const { data } = await api.put<Categoria>(`/categories/${id}`, { name, description });
  return data;
}

export async function definirCategoriaAtiva(id: number, active: boolean) {
  const { data } = await api.put<Categoria>(`/categories/${id}/status`, { active });
  return data;
}
