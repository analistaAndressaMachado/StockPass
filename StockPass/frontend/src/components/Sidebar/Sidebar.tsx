import { useState } from 'react';

type NavItem = { key: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { key: 'painel', label: 'Painel' },
  { key: 'catalogo', label: 'Catálogo de Produtos' },
  { key: 'entrada', label: 'Entrada de Estoque' },
  { key: 'saida', label: 'Saída de Estoque' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'clientes', label: 'Clientes' },
];

type Props = {
  active: string;
  onNavigate: (key: string) => void;
};

export function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">Armazém Pro</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
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