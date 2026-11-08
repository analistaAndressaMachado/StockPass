import { api } from './api';

export type SupplierProfile = {
  id: number;
  name: string;
  email: string;
  companyName: string;
  taxId: string | null;
  phone: string | null;
};

export type SupplierOffer = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  availableQuantity: number;
  supplierId: number;
  supplierName: string;
  companyName: string;
};

export type SupplierOfferInput = {
  sku: string;
  name: string;
  category: string;
  price: number;
  availableQuantity: number;
};

export type SupplierAcquisition = {
  purchaseId: number;
  offerId: number;
  productId: number;
  inventorySku: string;
  product: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockAfterPurchase: number;
  purchasedAt: string;
};

export type SupplierSale = {
  purchaseId: number;
  sku: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedAt: string;
};

export async function listarSaidasFornecedor() {
  const { data } = await api.get<SupplierSale[]>('/suppliers/purchases/mine');
  return data;
}

export async function obterPerfilFornecedor() {
  const { data } = await api.get<SupplierProfile>('/suppliers/me');
  return data;
}

export async function listarOfertasFornecedor() {
  const { data } = await api.get<SupplierOffer[]>('/suppliers/offers/mine');
  return data;
}

export async function criarOfertaFornecedor(oferta: SupplierOfferInput) {
  const { data } = await api.post<SupplierOffer>('/suppliers/offers/mine', oferta);
  return data;
}

export async function atualizarOfertaFornecedor(id: number, oferta: SupplierOfferInput) {
  const { data } = await api.put<SupplierOffer>(`/suppliers/offers/mine/${id}`, oferta);
  return data;
}

export async function desativarOfertaFornecedor(id: number) {
  await api.delete(`/suppliers/offers/mine/${id}`);
}

export async function listarMarketplaceFornecedores() {
  const { data } = await api.get<SupplierOffer[]>('/suppliers/offers');
  return data;
}

export async function adquirirOferta(id: number, quantity: number) {
  const { data } = await api.post<SupplierAcquisition>(`/suppliers/offers/${id}/acquire`, { quantity });
  return data;
}
