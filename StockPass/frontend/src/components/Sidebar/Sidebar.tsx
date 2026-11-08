type NavItem = {
  key: string;
  label: string;
  roles?: string[]; // se existir, só esses perfis enxergam o item no menu
};

const ROLES_INTERNOS = ['USER', 'GESTOR', 'ADMIN'];

const NAV_ITEMS: NavItem[] = [
  { key: 'painel', label: 'Painel', roles: ROLES_INTERNOS },
  { key: 'catalogo', label: 'Catálogo de Produtos', roles: ROLES_INTERNOS },
  { key: 'entrada', label: 'Entrada de Estoque', roles: ROLES_INTERNOS },
  { key: 'saida', label: 'Saída de Estoque', roles: ROLES_INTERNOS },
  { key: 'relatorios', label: 'Relatórios', roles: ROLES_INTERNOS },
  { key: 'clientes-admin', label: 'Clientes', roles: ROLES_INTERNOS },
  { key: 'clientes', label: 'Loja do Cliente', roles: ['CLIENTE'] },
  { key: 'fornecedores', label: 'Fornecedores', roles: [...ROLES_INTERNOS, 'FORNECEDOR'] },
  { key: 'usuarios', label: 'Usuários e Permissões', roles: ['ADMIN', 'GESTOR'] },
];

type Props = {
  active: string;
  onNavigate: (key: string) => void;
  role: string;
};

export function Sidebar({ active, onNavigate, role }: Props) {
  const itensVisiveis = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">Armazém Pro</span>
      </div>
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