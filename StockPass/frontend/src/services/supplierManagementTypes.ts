export type SupplierStatus = 'ACTIVE' | 'INACTIVE';
export type SupplierContractStatus = 'CURRENT' | 'EXPIRED' | 'CANCELED';

export type SupplierRecord = {
  id: number;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupplierRecordInput = {
  legalName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: SupplierStatus;
};

export type SupplierContract = {
  id: number;
  supplierId: number;
  contractNumber: string;
  /** Data civil no formato yyyy-MM-dd. */
  startDate: string;
  /** Data civil no formato yyyy-MM-dd. */
  endDate: string;
  value: number | null;
  status: SupplierContractStatus;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierContractInput = {
  contractNumber: string;
  /** Data civil no formato yyyy-MM-dd. */
  startDate: string;
  /** Data civil no formato yyyy-MM-dd. */
  endDate: string;
  value: number | null;
  status: SupplierContractStatus;
  observations: string | null;
};
