import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { mensagemErro } from '../../services/stockApi';
import type { SupplierContract, SupplierContractInput, SupplierContractStatus } from '../../services/supplierManagementTypes';

type Props = {
  contract?: SupplierContract;
  onClose: () => void;
  onSave: (input: SupplierContractInput) => Promise<void>;
};

type FormState = {
  contractNumber: string;
  startDate: string;
  endDate: string;
  value: string;
  status: SupplierContractStatus;
  observations: string;
};

function formFromContract(contract?: SupplierContract): FormState {
  return {
    contractNumber: contract?.contractNumber ?? '',
    startDate: contract?.startDate ?? '',
    endDate: contract?.endDate ?? '',
    value: contract?.value === null || contract?.value === undefined ? '' : String(contract.value),
    status: contract?.status ?? 'CURRENT',
    observations: contract?.observations ?? '',
  };
}

export function SupplierContractModal({ contract, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() => formFromContract(contract));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.contractNumber.trim()) {
      setError('Informe o número do contrato.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('A data de fim não pode ser anterior à data de início.');
      return;
    }
    const numericValue = form.value.trim() === '' ? null : Number(form.value);
    if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0)) {
      setError('Informe um valor válido maior ou igual a zero.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        contractNumber: form.contractNumber.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        value: numericValue,
        status: form.status,
        observations: form.observations.trim() || null,
      });
    } catch (saveError: unknown) {
      setError(mensagemErro(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={contract ? 'Editar contrato' : 'Novo contrato'} onClose={saving ? () => {} : onClose}>
      <form className="modal-form fornecedores-modal-form" onSubmit={submit}>
        <label>Número do contrato
          <input value={form.contractNumber}
            onChange={(event) => setForm({ ...form, contractNumber: event.target.value })} required />
        </label>
        <label>Data de início
          <input type="date" value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
        </label>
        <label>Data de fim
          <input type="date" value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })} required />
        </label>
        <label>Valor (opcional)
          <input type="number" min="0" step="0.01" value={form.value}
            onChange={(event) => setForm({ ...form, value: event.target.value })} />
        </label>
        <label>Situação
          <select value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as SupplierContractStatus })}>
            <option value="CURRENT">Vigente</option>
            <option value="EXPIRED">Vencido</option>
            <option value="CANCELED">Cancelado</option>
          </select>
        </label>
        <label>Observações
          <textarea rows={3} value={form.observations}
            onChange={(event) => setForm({ ...form, observations: event.target.value })} />
        </label>
        {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
        <div className="fornecedores-modal-actions">
          <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : contract ? 'Salvar alterações' : 'Cadastrar contrato'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
