import { useEffect, useState } from 'react';
import { api } from './services/api';
import { Login } from './pages/Login/Login';
import { Painel } from './pages/Painel/Painel';
import { Perfil } from './pages/Perfil/Perfil';
import { Relatorios } from './pages/Relatorios/Relatorios';
import { Catalogo } from './pages/Catalogo/Catalogo';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import type { User } from './types';

const PAGE_TITLES: Record<string, string> = {
  painel: 'Painel',
  catalogo: 'Catálogo de Produtos',
  entrada: 'Entrada de Estoque',
  saida: 'Saída de Estoque',
  relatorios: 'Relatórios',
  clientes: 'Clientes',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('painel');

  useEffect(() => {
    const token = localStorage.getItem('stockpass_token');
    if (token) {
      api
        .get('/auth/profile')
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('stockpass_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="app-content">
        <Header title={PAGE_TITLES[page] ?? 'Perfil'} user={user} onProfileClick={() => setPage('perfil')} />
        <div className="app-body">
         {page === 'painel' ? (
           <Painel />
         ) : page === 'perfil' ? (
           <Perfil user={user} onLogout={() => { localStorage.removeItem('stockpass_token'); setUser(null); }} />
         ) : page === 'catalogo' ? (
           <Catalogo />
         ) : page === 'relatorios' ? (
           <Relatorios />
         ) : (
           <p className="muted">Essa área ainda está em construção 🚧</p>
         )}
        </div>
      </div>
    </div>
  );
}