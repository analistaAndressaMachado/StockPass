import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
import { mensagemErro } from '../../services/stockApi';
import type { SupplierRecord, SupplierRecordInput, SupplierStatus } from '../../services/supplierManagementTypes';

type Props = {
  supplier?: SupplierRecord;
  onClose: () => void;
  onSave: (input: SupplierRecordInput) => Promise<void>;
};

type FormState = {
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  status: SupplierStatus;
};

function formFromSupplier(supplier?: SupplierRecord): FormState {
  return {
    legalName: supplier?.legalName ?? '',
    cnpj: supplier?.cnpj ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
    status: supplier?.status ?? 'ACTIVE',
  };
}

export function SupplierRecordModal({ supplier, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => formFromSupplier(supplier));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.legalName.trim() || !form.cnpj.trim() || !form.email.trim()) {
      setError('Preencha nome/razão social, CNPJ e e-mail.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        legalName: form.legalName.trim(),
        cnpj: form.cnpj.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        status: form.status,
      });
    } catch (saveError: unknown) {
      setError(mensagemErro(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={supplier ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={saving ? () => {} : onClose}>
      <form className="modal-form fornecedores-modal-form" onSubmit={submit}>
        <label>Nome / razão social
          <input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })}
            placeholder="Ex: Distribuidora Central Ltda." maxLength={255} required />
        </label>
        <label>CNPJ
          <input value={form.cnpj} onChange={(event) => setForm({ ...form, cnpj: event.target.value })} placeholder="Ex: 12.345.678/0001-90" required />
        </label>
        <label>E-mail
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="Ex: contato@empresa.com.br" required />
        </label>
        <label>Telefone
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Ex: (11) 3333-4444" />
        </label>
        <label>Endereço
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Ex: Rua Central, 123 - São Paulo/SP" />
        </label>
        <label>Situação
          <Select<SupplierStatus> ariaLabel="Situação do fornecedor" value={form.status}
            onChange={(status) => setForm({ ...form, status })} options={[
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'INACTIVE', label: 'Inativo' },
            ]} />
        </label>
        {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
        <div className="fornecedores-modal-actions">
          <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : supplier ? 'Salvar alterações' : 'Cadastrar fornecedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
