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

export function SupplierContractsSection({ supplierId, supplierName, canManage }: Props) {
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
  }

  return (
    <div className="fornecedor-contracts-inline">
      <div className="fornecedores-section-title">
        <div>
          <h2>Contratos</h2>
          <p className="muted-sm">Contratos vinculados ao fornecedor selecionado.</p>
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
          <table className="table fornecedores-management-table">
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
              {contracts.map((contract) => (
                <tr key={contract.id} className="fornecedor-contract-row" onClick={() => setDetailContract(contract)}>
                  <td>{contract.contractNumber}</td>
                  <td>{formatarDataCivil(contract.startDate)}</td>
                  <td>{formatarDataCivil(contract.endDate)}</td>
                  <td>{formatarValor(contract.value)}</td>
                  <td><span className={`badge ${contract.status === 'CURRENT' ? 'badge-green' : contract.status === 'EXPIRED' ? 'badge-orange' : 'badge-blue'}`}>
                    {STATUS_LABEL[contract.status]}
                  </span></td>
                  <td>{contract.observations || '—'}</td>
                  {canManage && <td><button className="btn-secondary" type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setModalContract(contract);
                    }}>Editar</button></td>}
                </tr>
              ))}
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
            <div><dt>Fim</dt><dd>{formatarDataCivil(detailContract.endDate)}</dd></div>
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
