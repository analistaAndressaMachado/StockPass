import { Brand } from '../Brand/Brand';

type NavItem = {
  key: string;
  label: string;
  roles?: string[];
};

const ROLES_INTERNOS = ['USER', 'GESTOR', 'ADMIN'];

const NAV_ITEMS: NavItem[] = [
  { key: 'painel', label: 'Painel', roles: ROLES_INTERNOS },
  { key: 'catalogo', label: 'Catálogo de Produtos', roles: ROLES_INTERNOS },
  { key: 'entrada', label: 'Entrada de Estoque', roles: ROLES_INTERNOS },
  { key: 'saida', label: 'Saída de Estoque', roles: ROLES_INTERNOS },
  { key: 'relatorios', label: 'Relatórios', roles: ROLES_INTERNOS },
  { key: 'clientes-admin', label: 'Clientes', roles: ROLES_INTERNOS },
  { key: 'clientes', label: 'Área do Cliente', roles: ['CLIENTE'] },
  { key: 'fornecedores', label: 'Fornecedores', roles: [...ROLES_INTERNOS, 'FORNECEDOR'] },
  { key: 'usuarios', label: 'Usuários e Permissões', roles: ['ADMIN', 'GESTOR'] },
];

type Props = {
  active: string;
  onNavigate: (key: string) => void;
  role: string;
  permissions?: Record<string, string>;
};

const MODULE_BY_ITEM: Record<string, string> = {
  painel: 'painel', catalogo: 'catalogo', entrada: 'entrada', saida: 'saida',
  relatorios: 'relatorios', 'clientes-admin': 'clientes', fornecedores: 'fornecedores', usuarios: 'usuarios',
};

export function Sidebar({ active, onNavigate, role, permissions }: Props) {
  const itensVisiveis = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role) && !(item.key === 'usuarios' && permissions?.usuarios && permissions.usuarios !== 'nenhum')) return false;
    const module = MODULE_BY_ITEM[item.key];
    if (!module || role === 'FORNECEDOR' || role === 'CLIENTE') return true;
    return permissions?.[module] !== undefined
      ? permissions[module] !== 'nenhum'
      : module !== 'usuarios' || role === 'ADMIN' || role === 'GESTOR';
  });

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="sidebar-nav">
        {itensVisiveis.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${active === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="sidebar-nav-dot" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
