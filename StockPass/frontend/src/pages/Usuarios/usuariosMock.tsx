import { formatarDataHora } from '../EntradaEstoque/entradasMock';

// Reaproveita a função de data da tela de Entrada (mesmo motivo da Saída).
export { formatarDataHora };

// Os mesmos 3 perfis que já existem no backend.
export type Perfil = 'USER' | 'GESTOR' | 'ADMIN';

export const PERFIS: Perfil[] = ['USER', 'GESTOR', 'ADMIN'];

export const NOME_PERFIL: Record<Perfil, string> = {
  USER: 'Funcionário',
  GESTOR: 'Gerente',
  ADMIN: 'Administrador',
};

export const DESCRICAO_PERFIL: Record<Perfil, string> = {
  USER: 'Operação do dia a dia',
  GESTOR: 'Supervisão e relatórios',
  ADMIN: 'Controle total do sistema',
};

export function perfilClass(perfil: Perfil) {
  if (perfil === 'ADMIN') return 'badge badge-blue';
  if (perfil === 'GESTOR') return 'badge badge-yellow';
  return 'badge badge-gray';
}

// Nível de acesso que um perfil tem em cada área do sistema.
export type Nivel = 'nenhum' | 'ver' | 'editar';

export const NIVEL_TEXTO: Record<Nivel, string> = {
  nenhum: 'Sem acesso',
  ver: 'Só ver',
  editar: 'Ver e editar',
};

export function nivelClass(nivel: Nivel) {
  if (nivel === 'editar') return 'badge badge-green';
  if (nivel === 'ver') return 'badge badge-blue';
  return 'badge badge-gray';
}

export type Modulo = {
  chave: string;
  nome: string;
  descricao: string;
  niveis: Record<Perfil, Nivel>;
};

// Uma linha por área do menu (em vez de uma por ação) pra tabela não ficar gigante.
export const MODULOS: Modulo[] = [
  {
    chave: 'painel',
    nome: 'Painel',
    descricao: 'Visão geral e alertas de estoque',
    niveis: { USER: 'ver', GESTOR: 'ver', ADMIN: 'ver' },
  },
  {
    chave: 'catalogo',
    nome: 'Catálogo de Produtos',
    descricao: 'Cadastrar, editar e excluir produtos',
    niveis: { USER: 'editar', GESTOR: 'editar', ADMIN: 'editar' },
  },
  {
    chave: 'entrada',
    nome: 'Entrada de Estoque',
    descricao: 'Registrar o que chegou ao estoque',
    niveis: { USER: 'editar', GESTOR: 'editar', ADMIN: 'editar' },
  },
  {
    chave: 'saida',
    nome: 'Saída de Estoque',
    descricao: 'Registrar o que saiu do estoque',
    niveis: { USER: 'editar', GESTOR: 'editar', ADMIN: 'editar' },
  },
  {
    chave: 'relatorios',
    nome: 'Relatórios',
    descricao: 'Resumos e gráficos de movimentação',
    niveis: { USER: 'ver', GESTOR: 'ver', ADMIN: 'ver' },
  },
  {
    chave: 'usuarios',
    nome: 'Usuários e Permissões',
    descricao: 'Contas, perfis e atividades',
    niveis: { USER: 'nenhum', GESTOR: 'ver', ADMIN: 'editar' },
  },
];

export function nivelDoPerfil(perfil: Perfil, chave: string): Nivel {
  return MODULOS.find((m) => m.chave === chave)?.niveis[perfil] ?? 'nenhum';
}

export type UsuarioSistema = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  ultimoAcesso: string | null; // ISO, ou null se nunca acessou
};

export type Atividade = {
  id: number;
  dataHora: string;
  usuario: string;
  acao: string;
};

