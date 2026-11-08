import { api } from './api';
import type { Atividade, Perfil, UsuarioSistema } from '../pages/Usuarios/usuariosMock';

type UserDto = { id: number; name: string; email: string; role: Perfil; active: boolean; lastLoginAt: string | null };
type ActivityDto = { id: number; createdAt: string; actor: string; action: string };

function usuario(item: UserDto): UsuarioSistema {
  return { id: item.id, nome: item.name, email: item.email, perfil: item.role, ativo: item.active, ultimoAcesso: item.lastLoginAt };
}

export async function listarUsuarios(): Promise<UsuarioSistema[]> {
  const { data } = await api.get<UserDto[]>('/users');
  return data.map(usuario);
}

export async function listarAtividadesUsuarios(): Promise<Atividade[]> {
  const { data } = await api.get<ActivityDto[]>('/users/activities');
  return data.map(item => ({ id: item.id, dataHora: item.createdAt, usuario: item.actor, acao: item.action }));
}

export async function criarUsuario(dados: { nome: string; email: string; perfil: Perfil; senha: string }): Promise<void> {
  await api.post('/users', { name: dados.nome, email: dados.email, role: dados.perfil, password: dados.senha });
}

export async function editarUsuario(id: number, dados: { nome: string; perfil: Perfil }): Promise<void> {
  await api.put(`/users/${id}`, { name: dados.nome, role: dados.perfil });
}

export async function alterarStatusUsuario(id: number, ativo: boolean): Promise<void> {
  await api.put(`/users/${id}/status`, { active: ativo });
}