import { useEffect, useState } from 'react';
import { api } from './services/api';
import { Login } from './pages/Login/Login';
import { Painel } from './pages/Painel/Painel';
import { Sidebar } from './components/Sidebar/Sidebar';
import type { User } from './types';

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
      {page === 'painel' ? (
        <Painel user={user} />
      ) : (
        <div className="painel">
          <p className="muted">Essa área ainda está em construção 🚧</p>
        </div>
      )}
    </div>
  );
}