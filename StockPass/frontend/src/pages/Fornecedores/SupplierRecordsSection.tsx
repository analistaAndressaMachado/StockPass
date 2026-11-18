import { Fragment, useEffect, useState } from 'react';
import { mensagemErro } from '../../services/stockApi';
import {
  atualizarFornecedorCadastrado,
  criarFornecedorCadastrado,
  listarFornecedoresCadastrados,
} from '../../services/supplierManagementApi';
import type { SupplierRecord, SupplierRecordInput, SupplierStatus } from '../../services/supplierManagementTypes';
import { SupplierContractsSection } from './SupplierContractsSection';
import { SupplierRecordModal } from './SupplierRecordModal';

type Props = {
  canManage: boolean;
};

type ModalState = SupplierRecord | 'new' | null;

const STATUS_LABEL: Record<SupplierStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

export function SupplierRecordsSection({ canManage }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [openSupplierId, setOpenSupplierId] = useState<number | null>(null);
  const [modalSupplier, setModalSupplier] = useState<ModalState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function recarregarFornecedores(preferredId?: number) {
    const items = await listarFornecedoresCadastrados();
    setSuppliers(items);
    if (preferredId !== undefined) setOpenSupplierId(preferredId);
  }

  useEffect(() => {
    let active = true;
    listarFornecedoresCadastrados()
      .then((items) => {
        if (!active) return;
        setSuppliers(items);
      })
      .catch((loadError: unknown) => { if (active) setError(mensagemErro(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function salvarFornecedor(input: SupplierRecordInput) {
    const saved = modalSupplier === 'new'
      ? await criarFornecedorCadastrado(input)
      : modalSupplier
        ? await atualizarFornecedorCadastrado(modalSupplier.id, input)
        : null;
    if (!saved) return;

    setModalSupplier(null);
    setError('');
    try {
      await recarregarFornecedores(saved.id);
    } catch (refreshError: unknown) {
      setError(`Fornecedor salvo, mas a lista não foi atualizada: ${mensagemErro(refreshError)}`);
    }
  }

  function alternarFornecedor(supplierId: number) {
    setOpenSupplierId((current) => current === supplierId ? null : supplierId);
  }

  return (
    <div className="fornecedores-management">
      <section className="panel-card panel-card--soft-padrao fornecedores-management-card">
        <div className="fornecedores-section-title">
          <div>
            <h2>Fornecedores cadastrados</h2>
            <p className="muted-sm">Clique na seta para ver os contratos.</p>
          </div>
          <div className="fornecedores-management-actions">
            <span className="fornecedores-contagem">{suppliers.length} cadastrados</span>
            {canManage && <button className="btn-primary" type="button" disabled={loading}
              onClick={() => setModalSupplier('new')}>
              Novo fornecedor
            </button>}
          </div>
        </div>

        {error && <p className="fornecedores-feedback fornecedores-feedback-error" role="alert">{error}</p>}
        {loading ? <p className="muted-sm">Carregando fornecedores...</p> : error && suppliers.length === 0 ? null : suppliers.length === 0 ? (
          <div className="fornecedores-empty">Nenhum fornecedor cadastrado.</div>
        ) : (
          <div className="fornecedores-management-table-wrap">
            <table className="table fornecedores-management-table">
              <thead>
                <tr>
                  <th aria-label="Expandir contratos" />
                  <th>Razão social</th>
                  <th>CNPJ</th>
                  <th>Situação</th>
                  {canManage && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const aberto = openSupplierId === supplier.id;
                  return <Fragment key={supplier.id}>
                  <tr className={`fornecedor-linha-clicavel ${aberto ? 'fornecedor-selecionado' : ''}`}
                    role="button" tabIndex={0} aria-expanded={aberto}
                    aria-label={`${aberto ? 'Recolher' : 'Expandir'} contratos de ${supplier.legalName}`}
                    onClick={() => alternarFornecedor(supplier.id)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        alternarFornecedor(supplier.id);
                      }
                    }}>
                    <td className="col-seta">
                      <button className="fornecedor-seta-button" type="button"
                        aria-expanded={aberto}
                        aria-label={`${aberto ? 'Recolher' : 'Expandir'} contratos de ${supplier.legalName}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          alternarFornecedor(supplier.id);
                        }}>
                        <span className={`seta ${aberto ? 'seta-aberta' : ''}`} aria-hidden="true">›</span>
                      </button>
                    </td>
                    <td>
                      <span>{supplier.legalName}</span>
                    </td>
                    <td>{supplier.cnpj}</td>
                    <td><span className={`badge ${supplier.status === 'ACTIVE' ? 'badge-green' : 'badge-blue'}`}>
                      {STATUS_LABEL[supplier.status]}
                    </span></td>
                    {canManage && <td>
                      <button className="btn-secondary" type="button" onClick={(event) => {
                        event.stopPropagation();
                        setModalSupplier(supplier);
                      }}>Editar</button>
                    </td>}
                  </tr>
                  {aberto && <tr className="linha-detalhe fornecedor-contratos-detalhe">
                    <td colSpan={canManage ? 5 : 4}>
                      <SupplierContractsSection key={supplier.id} supplierId={supplier.id}
                        supplierName={supplier.legalName} canManage={canManage} />
                    </td>
                  </tr>}
                  </Fragment>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalSupplier !== null && <SupplierRecordModal
        supplier={modalSupplier === 'new' ? undefined : modalSupplier}
        onClose={() => setModalSupplier(null)}
        onSave={salvarFornecedor}
      />}
    </div>
  );
}
