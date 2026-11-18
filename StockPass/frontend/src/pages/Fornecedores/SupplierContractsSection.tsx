import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { mensagemErro } from '../../services/stockApi';
import {
  atualizarContratoFornecedor,
  criarContratoFornecedor,
  listarContratosFornecedor,
} from '../../services/supplierManagementApi';
import type { SupplierContract, SupplierContractInput, SupplierContractStatus } from '../../services/supplierManagementTypes';
import { SupplierContractModal } from './SupplierContractModal';

type Props = {
  supplierId: number;
  supplierName: string;
  canManage: boolean;
  onContractsSaved?: () => Promise<void>;
};

const STATUS_LABEL: Record<SupplierContractStatus, string> = {
  CURRENT: 'Vigente',
  EXPIRED: 'Vencido',
  CANCELED: 'Cancelado',
};

function formatarDataCivil(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatarValor(value: number | null) {
  return value === null ? '—' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function ordinalDataCivil(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return Math.floor(date.getTime() / MS_POR_DIA);
}

function diasAteDataCivil(value: string) {
  const target = ordinalDataCivil(value);
  if (target === null) return null;
  const now = new Date();
  const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_POR_DIA);
  return target - today;
}

function avisoVencimento(contract: SupplierContract) {
  if (contract.status !== 'CURRENT') return null;
  const days = diasAteDataCivil(contract.endDate);
  if (days === null) return null;
  if (days < 0) {
    const overdue = Math.abs(days);
    return { label: `Vencido há ${overdue} ${overdue === 1 ? 'dia' : 'dias'}`, className: 'badge-red' };
  }
  if (days > 30) return null;
  if (days === 0) return { label: 'Vence hoje', className: 'badge-orange' };
  if (days === 1) return { label: 'Vence amanhã', className: 'badge-orange' };
  return { label: `Vence em ${days} dias`, className: 'badge-orange' };
}

export function SupplierContractsSection({ supplierId, supplierName, canManage, onContractsSaved }: Props) {
  const [contracts, setContracts] = useState<SupplierContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalContract, setModalContract] = useState<SupplierContract | 'new' | null>(null);
  const [detailContract, setDetailContract] = useState<SupplierContract | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setContracts([]);
    setError('');

    setLoading(true);
    listarContratosFornecedor(supplierId)
      .then((items) => { if (active) setContracts(items); })
      .catch((loadError: unknown) => { if (active) setError(mensagemErro(loadError)); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [supplierId, reloadKey]);

  async function salvarContrato(input: SupplierContractInput) {
    if (modalContract === 'new') {
      await criarContratoFornecedor(supplierId, input);
    } else if (modalContract) {
      await atualizarContratoFornecedor(supplierId, modalContract.id, input);
    }
    setModalContract(null);
    setError('');
    setReloadKey((current) => current + 1);
    await onContractsSaved?.();
  }

  const avisoDoModal = detailContract ? avisoVencimento(detailContract) : null;

  return (
    <div className="fornecedor-contracts-inline">
      <div className="fornecedores-section-title">
        <div>
          <h2>Contratos</h2>
        </div>
        {canManage && <button className="btn-primary" type="button" onClick={() => setModalContract('new')}>
          Novo contrato
        </button>}
      </div>

      {loading ? <p className="muted-sm">Carregando contratos...</p> : error ? (
        <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>
      ) : contracts.length === 0 ? (
        <div className="fornecedores-empty">Este fornecedor ainda não possui contratos cadastrados.</div>
      ) : (
        <div className="fornecedores-management-table-wrap">
          <table className={`table fornecedores-management-table fornecedor-contracts-table ${canManage ? 'fornecedor-contracts-table--actions' : 'fornecedor-contracts-table--readonly'}`}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Observações</th>
                {canManage && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => {
                const aviso = avisoVencimento(contract);
                return <tr key={contract.id} className="fornecedor-contract-row" onClick={() => setDetailContract(contract)}>
                  <td className="fornecedor-contract-number">{contract.contractNumber}</td>
                  <td>{formatarDataCivil(contract.startDate)}</td>
                  <td><div className="fornecedor-contract-end-cell">
                    <span>{formatarDataCivil(contract.endDate)}</span>
                    {aviso && <span className={`badge ${aviso.className} fornecedor-vencimento-badge`}>{aviso.label}</span>}
                  </div></td>
                  <td>{formatarValor(contract.value)}</td>
                  <td><span className={`badge ${contract.status === 'CURRENT' ? 'badge-green' : contract.status === 'EXPIRED' ? 'badge-orange' : 'badge-blue'}`}>
                    {STATUS_LABEL[contract.status]}
                  </span></td>
                  <td title={contract.observations || ''}>
                    <span className="fornecedor-contract-observation-cell">{contract.observations || '—'}</span>
                  </td>
                  {canManage && <td><button className="btn-secondary" type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setModalContract(contract);
                    }}>Editar</button></td>}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
      {modalContract !== null && <SupplierContractModal
        contract={modalContract === 'new' ? undefined : modalContract}
        onClose={() => setModalContract(null)}
        onSave={salvarContrato}
      />}
      {detailContract !== null && <Modal
        title={<span className="fornecedor-contract-modal-title">
          Contrato {detailContract.contractNumber}
          <span className={`badge ${detailContract.status === 'CURRENT' ? 'badge-green' : detailContract.status === 'EXPIRED' ? 'badge-orange' : 'badge-blue'}`}>
            {STATUS_LABEL[detailContract.status]}
          </span>
        </span>}
        size="medium"
        onClose={() => setDetailContract(null)}
      >
        <div className="fornecedor-contract-details">
          <dl>
            <div><dt>Fornecedor</dt><dd>{supplierName}</dd></div>
            <div><dt>Valor</dt><dd>{formatarValor(detailContract.value)}</dd></div>
            <div><dt>In&#237;cio</dt><dd>{formatarDataCivil(detailContract.startDate)}</dd></div>
            <div><dt>Fim</dt><dd>{formatarDataCivil(detailContract.endDate)}{avisoDoModal && <span className={`badge ${avisoDoModal.className} fornecedor-vencimento-badge`}>{avisoDoModal.label}</span>}</dd></div>
          </dl>
          <section className="fornecedor-contract-observations">
            <h3>Observa&#231;&#245;es</h3>
            <p>{detailContract.observations || 'Sem observa&#231;&#245;es'}</p>
          </section>
          {canManage && <div className="fornecedor-contract-modal-footer">
            <button className="btn-primary" type="button" onClick={() => {
              setModalContract(detailContract);
              setDetailContract(null);
            }}>Editar</button>
          </div>}
        </div>
      </Modal>}
    </div>
  );
}
