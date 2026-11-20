import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
import { mensagemErro } from '../../services/stockApi';
import type { ClienteCadastrado, EditarClienteInput, NovoClienteInput } from '../../services/clientStoreApi';

type SituacaoCliente = 'ACTIVE' | 'INACTIVE';
type Props = {
  onClose: () => void;
  onSave: (input: NovoClienteInput | EditarClienteInput) => Promise<void>;
  cliente?: ClienteCadastrado;
  onDelete?: () => Promise<void>;
};
type FormState = { name: string; email: string; phone: string; password: string; status: SituacaoCliente };

export function ClienteModal({ onClose, onSave, cliente, onDelete }: Props) {
  const editing = Boolean(cliente);
  const [form, setForm] = useState<FormState>({
    name: cliente?.name ?? '', email: cliente?.email ?? '', phone: cliente?.phone ?? '', password: '',
    status: cliente?.active ? 'ACTIVE' : 'INACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const busy = saving || deleting;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) { setError('Informe o nome do cliente.'); return; }
    if (form.password && form.password.length < 6) { setError('A nova senha deve possuir pelo menos 6 caracteres.'); return; }
    setSaving(true); setError('');
    try {
      const common = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, active: form.status === 'ACTIVE' };
      await onSave(editing ? { ...common, ...(form.password ? { password: form.password } : {}) } : { ...common, password: form.password });
    } catch (saveError: unknown) { setError(mensagemErro(saveError)); }
    finally { setSaving(false); }
  }

  async function excluir() {
    if (!onDelete) return;
    setDeleting(true); setError('');
    try { await onDelete(); }
    catch (deleteError: unknown) { setError(mensagemErro(deleteError)); setConfirmDelete(false); }
    finally { setDeleting(false); }
  }

  return (
    <Modal title={editing ? 'Editar cliente' : 'Novo cliente'} onClose={busy ? () => {} : onClose}>
      {confirmDelete ? <div className="clientes-admin-confirmar-exclusao">
        <p>Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.</p>
        {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
        <div className="fornecedores-modal-actions">
          <button className="btn-secondary" type="button" disabled={busy} onClick={() => { setConfirmDelete(false); setError(''); }}>Voltar</button>
          <button className="clientes-admin-btn-perigo" type="button" disabled={busy} onClick={() => void excluir()}>{deleting ? 'Excluindo...' : 'Sim, excluir'}</button>
        </div>
      </div> : <form className="modal-form" onSubmit={submit}>
        <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Maria Silva" maxLength={255} autoComplete="name" required /></label>
        <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Ex: maria@email.com" maxLength={255} autoComplete="email" required /></label>
        <label>Telefone (opcional)<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Ex: (11) 99999-9999" autoComplete="tel" /></label>
        <label>{editing ? 'Nova senha (opcional)' : 'Senha inicial'}<input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? 'Deixe em branco para manter a atual' : 'Mínimo de 6 caracteres'} minLength={form.password ? 6 : undefined} autoComplete="new-password" required={!editing} /></label>
        {editing && <p className="clientes-admin-dica-senha">Em branco mantém a senha atual. Se preenchida, deve ter no mínimo 6 caracteres.</p>}
        <button className="link-sm clientes-admin-toggle-senha" type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={busy}>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</button>
        <label>Situação<Select<SituacaoCliente> ariaLabel="Situação do cliente" value={form.status} onChange={(status) => setForm({ ...form, status })} disabled={busy} options={[{ value: 'ACTIVE', label: 'Ativo' }, { value: 'INACTIVE', label: 'Inativo' }]} /></label>
        {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
        <div className="fornecedores-modal-actions">
          <button className="btn-secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
          {editing && <button className="clientes-admin-btn-perigo" type="button" onClick={() => { setConfirmDelete(true); setError(''); }} disabled={busy}>Excluir</button>}
          <button className="btn-primary" type="submit" disabled={busy}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar'}</button>
        </div>
      </form>}
    </Modal>
  );
}
