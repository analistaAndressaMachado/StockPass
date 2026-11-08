import { useEffect, useState } from 'react';
import { api } from './services/api';
import { Login } from './pages/Login/Login';
import { Painel } from './pages/Painel/Painel';
import { Perfil } from './pages/Perfil/Perfil';
import { Relatorios } from './pages/Relatorios/Relatorios';
import { Catalogo } from './pages/Catalogo/Catalogo';
import { EntradaEstoque } from './pages/EntradaEstoque/EntradaEstoque';
import { SaidaEstoque } from './pages/SaidaEstoque/SaidaEstoque';
import { Usuarios } from './pages/Usuarios/Usuarios';
import { Fornecedores } from './pages/Fornecedores/Fornecedores';
import { LojaCliente } from './pages/Clientes/LojaCliente';
import { ClientesAdmin } from './pages/Clientes/ClientesAdmin';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import type { Produto, User } from './types';

const PAGE_TITLES: Record<string, string> = {
  painel: 'Painel',
  catalogo: 'Catálogo de Produtos',
  entrada: 'Entrada de Estoque',
  saida: 'Saída de Estoque',
  relatorios: 'Relatórios',
  clientes: 'Área do Cliente',
  'clientes-admin': 'Clientes',
  fornecedores: 'Fornecedores',
    usuarios: 'Usuários e Permissões',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('painel');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingRestock, setPendingRestock] = useState<{
    productId: number;
    quantity: number;
    replenishmentId?: number;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('stockpass_token');
    if (token) {
      api
        .get('/auth/profile')
        .then((r) => {
          setUser(r.data);
          if (r.data.role === 'FORNECEDOR') setPage('fornecedores');
          else if (r.data.role === 'CLIENTE') setPage('clientes');
        })
        .catch(() => localStorage.removeItem('stockpass_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pendingAction && pendingAction === page) setPendingAction(null);
  }, [pendingAction, page]);

  useEffect(() => {
    if (pendingRestock && page === 'entrada') setPendingRestock(null);
  }, [pendingRestock, page]);

  function navegarPeloPainel(target: string, abrirModal = false) {
    setPendingAction(abrirModal ? target : null);
    setPage(target);
  }

  function navegarPelaSidebar(target: string) {
    setPendingAction(null);
    setPage(target);
  }

  function iniciarReposicao(produto: Produto) {
    setPendingRestock({
      productId: produto.id,
      quantity: produto.pontoReposicao - produto.quantidade,
    });
    setPage('entrada');
  }

  function receberReposicao(reposicao: { productId: number; quantity: number; replenishmentId: number }) {
    setPendingRestock(reposicao);
    setPage('entrada');
  }

  function finalizarLogin(usuario: User) {
    setUser(usuario);
    setPage(usuario.role === 'FORNECEDOR' ? 'fornecedores' : usuario.role === 'CLIENTE' ? 'clientes' : 'painel');
  }

  if (loading) return null;

  if (!user) {
    return <Login onLogin={finalizarLogin} />;
  }

  return (
    <div className="app-shell">
    <Sidebar active={page} onNavigate={navegarPelaSidebar} role={user.role} />
      <div className="app-content">
        <Header title={PAGE_TITLES[page] ?? 'Perfil'} user={user} onProfileClick={() => setPage('perfil')} />
        <div className="app-body">
         {page === 'painel' ? (
           <Painel onNavigate={navegarPeloPainel} onRestock={iniciarReposicao} />
         ) : page === 'perfil' ? (
           <Perfil user={user} onUserUpdated={setUser} onLogout={() => { localStorage.removeItem('stockpass_token'); setUser(null); }} />
         ) : page === 'catalogo' ? (
           <Catalogo openNovoProduto={pendingAction === 'catalogo'} />
             ) : page === 'entrada' ? (
                       <EntradaEstoque
                         openNovaEntrada={pendingAction === 'entrada'}
                         reposicao={pendingRestock}
                       />
                       ) : page === 'saida' ? (
                                 <SaidaEstoque openNovaSaida={pendingAction === 'saida'} />
                     ) : page === 'usuarios' ? (
                             <Usuarios user={user} />
                     ) : page === 'fornecedores' ? (
                       <Fornecedores user={user} />
                     ) : page === 'clientes' ? (
                       <LojaCliente />
                     ) : page === 'clientes-admin' ? (
                       <ClientesAdmin />
         ) : page === 'relatorios' ? (
           <Relatorios onReceiveReplenishment={receberReposicao} />
         ) : (
           <p className="muted">Essa área ainda está em construção 🚧</p>
         )}
        </div>
      </div>
    </div>
  );
}