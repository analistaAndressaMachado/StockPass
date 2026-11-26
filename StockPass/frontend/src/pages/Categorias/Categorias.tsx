import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { mensagemErro } from '../../services/stockApi';
import { atualizarCategoria, criarCategoria, definirCategoriaAtiva, listarCategorias, type Categoria } from '../../services/categoriesApi';
import './Categorias.css';

export function Categorias() {
  const [items, setItems] = useState<Categoria[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try { setItems(await listarCategorias()); setError(''); }
    catch (e) { setError(mensagemErro(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => items.filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))), [items, search]);
  function openForm(item?: Categoria) {
    setEditing(item ?? null); setName(item?.name ?? ''); setDescription(item?.description ?? ''); setError(''); setFormOpen(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const saved = editing ? await atualizarCategoria(editing.id, name, description) : await criarCategoria(name, description);
      setItems((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setEditing(null); setFormOpen(false); setError('');
    } catch (e) { setError(mensagemErro(e)); }
    finally { setSaving(false); }
  }
  async function toggle(item: Categoria) {
    try {
      const changed = await definirCategoriaAtiva(item.id, !item.active);
      setItems((current) => current.map((row) => row.id === changed.id ? changed : row)); setError('');
    } catch (e) { setError(mensagemErro(e)); }
  }

  return <section className="categorias-page">
    <header className="categorias-heading"><div><h2>Categorias</h2><p>Organize os produtos por categorias e acompanhe os vínculos.</p></div><button className="btn-primary" onClick={() => openForm()}>Nova categoria</button></header>
    {error && !formOpen && <p className="categorias-error" role="alert">{error}</p>}
    <div className="categorias-toolbar"><input aria-label="Pesquisar categorias" placeholder="Pesquisar por nome" value={search} onChange={(e) => setSearch(e.target.value)} /><span>{filtered.length} {filtered.length === 1 ? 'categoria' : 'categorias'}</span></div>
    <div className="categorias-table-wrap"><table className="table"><thead><tr><th>Nome</th><th>Descrição</th><th>Produtos vinculados</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {filtered.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.description || '—'}</td><td>{item.productCount}</td><td><span className={`categoria-status ${item.active ? 'is-active' : ''}`}>{item.active ? 'Ativa' : 'Inativa'}</span></td><td className="categoria-actions"><button className="btn-secondary" onClick={() => openForm(item)}>Editar</button><button className="btn-secondary" onClick={() => void toggle(item)}>{item.active ? 'Desativar' : 'Ativar'}</button></td></tr>)}
      {!loading && filtered.length === 0 && <tr><td colSpan={5} className="categorias-empty">{search ? 'Nenhuma categoria encontrada.' : 'Ainda não há categorias cadastradas.'}</td></tr>}
    </tbody></table></div>
    {loading && <p className="muted-sm">Carregando categorias...</p>}
    {formOpen && <Modal title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={() => setFormOpen(false)}>
      <form className="modal-form" onSubmit={save}><label>Nome<input autoFocus required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label><label>Descrição (opcional)<textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></label>{error && <p className="categorias-error" role="alert">{error}</p>}<button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar categoria'}</button></form>
    </Modal>}
  </section>;
}
