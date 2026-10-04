type NavItem = {
  key: string;
  label: string;
  roles?: string[]; // se existir, só esses perfis enxergam o item no menu
};

const NAV_ITEMS: NavItem[] = [
  { key: 'painel', label: 'Painel' },
  { key: 'catalogo', label: 'Catálogo de Produtos' },
  { key: 'entrada', label: 'Entrada de Estoque' },
  { key: 'saida', label: 'Saída de Estoque' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'usuarios', label: 'Usuários e Permissões', roles: ['ADMIN', 'GESTOR'] },
];

type Props = {
  active: string;
  onNavigate: (key: string) => void;
  role: string; // perfil de quem está logado (USER, GESTOR ou ADMIN)
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