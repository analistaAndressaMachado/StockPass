import { api } from './api';
import type {
  SupplierContract,
  SupplierContractInput,
  SupplierRecord,
  SupplierRecordInput,
} from './supplierManagementTypes';

export async function listarFornecedoresCadastrados() {
  const { data } = await api.get<SupplierRecord[]>('/suppliers/records');
  return data;
}

export async function obterFornecedorCadastrado(id: number) {
  const { data } = await api.get<SupplierRecord>(`/suppliers/records/${id}`);
  return data;
}

export async function criarFornecedorCadastrado(input: SupplierRecordInput) {
  const { data } = await api.post<SupplierRecord>('/suppliers/records', input);
  return data;
}

export async function atualizarFornecedorCadastrado(id: number, input: SupplierRecordInput) {
  const { data } = await api.put<SupplierRecord>(`/suppliers/records/${id}`, input);
  return data;
}

export async function listarContratosFornecedor(supplierId: number) {
  const { data } = await api.get<SupplierContract[]>(`/suppliers/records/${supplierId}/contracts`);
  return data;
}

export async function criarContratoFornecedor(supplierId: number, input: SupplierContractInput) {
  const { data } = await api.post<SupplierContract>(`/suppliers/records/${supplierId}/contracts`, input);
  return data;
}

export async function atualizarContratoFornecedor(supplierId: number, contractId: number, input: SupplierContractInput) {
  const { data } = await api.put<SupplierContract>(
    `/suppliers/records/${supplierId}/contracts/${contractId}`,
    input,
  );
  return data;
}

export async function listarContratosPertoDoVencimento(days = 30) {
  const { data } = await api.get<SupplierContract[]>('/suppliers/contracts/expiring', { params: { days } });
  return data;
}
