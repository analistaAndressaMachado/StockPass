import { formatarDataHora } from '../EntradaEstoque/entradasMock';

// Reaproveita a função de data da tela de Entrada (mesmo motivo da Saída).
export { formatarDataHora };

// ======================================================================
// DADOS MOCKADOS — só existem no frontend. Quando existir o backend:
//  - lista de usuários  -> GET /api/users (já existe a base: User, UserController)
//  - criar / editar     -> POST / PUT /api/users (só ADMIN)
//  - atividades         -> GET /api/atividades (log gravado pelo servidor)
// A tabela de permissões (MODULOS) também vai precisar existir no backend
// (Spring Security), porque esconder botão no front NÃO é segurança.
// Lembrar de atualizar o StockPass-itens-temporarios.md quando resolver.
// ======================================================================

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
    niveis: { USER: 'ver', GESTOR: 'editar', ADMIN: 'editar' },
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
    niveis: { USER: 'nenhum', GESTOR: 'ver', ADMIN: 'ver' },
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

const horasAtras = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const USUARIOS_INICIAIS: UsuarioSistema[] = [
  { id: 1, nome: 'Administrador', email: 'admin@stockpass.com', perfil: 'ADMIN', ativo: true, ultimoAcesso: horasAtras(0.2) },
  { id: 2, nome: 'Gestor', email: 'gestor@stockpass.com', perfil: 'GESTOR', ativo: true, ultimoAcesso: horasAtras(5) },
  { id: 3, nome: 'Andressa Machado', email: 'andressa@stockpass.com', perfil: 'ADMIN', ativo: true, ultimoAcesso: horasAtras(26) },
  { id: 4, nome: 'Henry', email: 'henry@stockpass.com', perfil: 'GESTOR', ativo: true, ultimoAcesso: horasAtras(2) },
  { id: 5, nome: 'Mariana', email: 'mariana@stockpass.com', perfil: 'USER', ativo: true, ultimoAcesso: horasAtras(30) },
  { id: 6, nome: 'Carlos Souza', email: 'carlos.souza@stockpass.com', perfil: 'USER', ativo: true, ultimoAcesso: horasAtras(52) },
  { id: 7, nome: 'Fernanda Lima', email: 'fernanda.lima@stockpass.com', perfil: 'USER', ativo: true, ultimoAcesso: horasAtras(75) },
  { id: 8, nome: 'Ricardo Alves', email: 'ricardo.alves@stockpass.com', perfil: 'GESTOR', ativo: false, ultimoAcesso: horasAtras(24 * 40) },
  { id: 9, nome: 'Juliana Costa', email: 'juliana.costa@stockpass.com', perfil: 'USER', ativo: true, ultimoAcesso: horasAtras(100) },
  { id: 10, nome: 'Paulo Mendes', email: 'paulo.mendes@stockpass.com', perfil: 'USER', ativo: false, ultimoAcesso: null },
];

export type Atividade = {
  id: number;
  dataHora: string;
  usuario: string;
  acao: string;
};

const ATIVIDADES_BASE: { usuario: string; acao: string }[] = [
  { usuario: 'Henry', acao: 'Registrou entrada de 55 Uni de Garrafa Reutilizável 750ml' },
  { usuario: 'Mariana', acao: 'Registrou saída de 3 Uni de Fone de Ouvido Bluetooth (Perda)' },
  { usuario: 'Administrador', acao: 'Alterou o perfil de Henry para Gerente' },
  { usuario: 'Carlos Souza', acao: 'Fez login no sistema' },
  { usuario: 'Gestor', acao: 'Cadastrou o produto Cabo HDMI 2m' },
  { usuario: 'Andressa Machado', acao: 'Criou o usuário Juliana Costa (Funcionário)' },
  { usuario: 'Fernanda Lima', acao: 'Registrou saída de 12 Uni de Pen Drive 32GB (Venda)' },
  { usuario: 'Administrador', acao: 'Desativou o usuário Ricardo Alves' },
  { usuario: 'Henry', acao: 'Editou o produto Caixa de Envio Média' },
  { usuario: 'Gestor', acao: 'Consultou o relatório do período "Este mês"' },
];

export const ATIVIDADES_INICIAIS: Atividade[] = Array.from({ length: 24 }, (_, n) => ({
  id: n + 1,
  dataHora: horasAtras(1 + n * 5 + (n % 3)),
  ...ATIVIDADES_BASE[n % ATIVIDADES_BASE.length],
}));