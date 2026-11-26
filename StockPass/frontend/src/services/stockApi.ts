import { api } from './api';
import axios from 'axios';
import type { Produto, ReservaSaida } from '../types';
import type { Entrada } from '../pages/EntradaEstoque/entradasMock';
import type { Saida } from '../pages/SaidaEstoque/saidasMock';

type ProductDto = {
  id: number;
  sku: string;
  name: string;
  category: string;
  categoryId: number;
  quantity: number;
  price: number;
  supplier: string;
  reorderPoint: number;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

type MovementDto = {
  id: number;
  type: 'ENTRY' | 'EXIT';
  createdAt: string;
  sku: string;
  product: string;
  quantity: number;
  supplier: string | null;
  invoiceNumber: string | null;
  reason: string | null;
  registeredBy: string;
  observation: string | null;
};

type StockReservationDto = ReservaSaida;

export type Reposicao = {
  id: number;
  productId: number;
  sku: string;
  produto: string;
  quantidade: number;
  recebida: number;
  status: 'SCHEDULED' | 'COMPLETED';
  agendadaEm: string;
  concluidaEm: string | null;
  registradaPor: string;
};

type ReplenishmentDto = {
  id: number;
  productId: number;
  sku: string;
  product: string;
  quantity: number;
  quantityReceived: number;
  status: 'SCHEDULED' | 'COMPLETED';
  scheduledAt: string;
  completedAt: string | null;
  registeredBy: string;
};

export type NovoProduto = Omit<Produto, 'id' | 'quantidade' | 'physicalQuantity' | 'reservedQuantity' | 'availableQuantity'> & {
  quantidadeInicial: number;
};

export function mensagemErro(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'Não foi possível conectar à API. Inicie o backend StockPass e tente novamente.';
    if (error.response.status === 403) return 'A API recusou o acesso. Confira seu perfil e faça login novamente.';
    return error.response?.data?.message ?? 'Não foi possível concluir a operação.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

export async function listarProdutos() {
  const { data } = await api.get<ProductDto[]>('/products');
  return data.map(produtoFromDto);
}

function produtoFromDto(item: ProductDto): Produto {
  return {
    id: item.id,
    sku: item.sku,
    categoryId: item.categoryId,
    nome: item.name,
    categoria: item.category,
    quantidade: item.quantity,
    preco: item.price,
    fornecedor: item.supplier,
    pontoReposicao: item.reorderPoint,
    physicalQuantity: item.physicalQuantity,
    reservedQuantity: item.reservedQuantity,
    availableQuantity: item.availableQuantity,
  };
}

export async function criarProduto(produto: NovoProduto) {
  const { data } = await api.post<ProductDto>('/products', {
    sku: produto.sku,
    name: produto.nome,
    categoryId: produto.categoryId,
    initialQuantity: produto.quantidadeInicial,
    price: produto.preco,
    supplier: produto.fornecedor,
    reorderPoint: produto.pontoReposicao,
  });
  return produtoFromDto(data);
}

export async function atualizarProduto(produto: Produto) {
  const { data } = await api.put<ProductDto>(`/products/${produto.id}`, {
    sku: produto.sku,
    name: produto.nome,
    categoryId: produto.categoryId,
    price: produto.preco,
    supplier: produto.fornecedor,
    reorderPoint: produto.pontoReposicao,
  });
  return produtoFromDto(data);
}

function entradaFromDto(item: MovementDto): Entrada {
  return {
    id: item.id,
    dataHora: item.createdAt,
    sku: item.sku,
    produto: item.product,
    fornecedor: item.supplier ?? '',
    quantidade: item.quantity,
    registradoPor: item.registeredBy,
    notaFiscal: item.invoiceNumber ?? '',
  };
}

function saidaFromDto(item: MovementDto): Saida {
  return {
    id: item.id,
    dataHora: item.createdAt,
    sku: item.sku,
    produto: item.product,
    quantidade: item.quantity,
    motivo: item.reason ?? '',
    registradoPor: item.registeredBy,
    observacao: item.observation ?? '',
  };
}

export async function listarEntradas() {
  const { data } = await api.get<MovementDto[]>('/entries');
  return data.map(entradaFromDto);
}

export async function registrarEntrada(productId: number, quantity: number, invoiceNumber: string, replenishmentId?: number) {
  const { data } = await api.post<MovementDto>('/entries', { productId, quantity, invoiceNumber, replenishmentId });
  return entradaFromDto(data);
}

export async function listarSaidas() {
  const { data } = await api.get<MovementDto[]>('/exits');
  return data.map(saidaFromDto);
}

export async function registrarSaida(productId: number, quantity: number, reason: string, observation: string) {
  const { data } = await api.post<MovementDto>('/exits', { productId, quantity, reason, observation });
  return saidaFromDto(data);
}

export async function criarReservaSaida(productId: number, quantity: number, reason: string, observation: string) {
  const { data } = await api.post<StockReservationDto>('/exits/reservations', {
    productId,
    quantity,
    reason,
    observation,
  });
  return data;
}

export async function listarReservasSaida() {
  const { data } = await api.get<StockReservationDto[]>('/exits/reservations');
  return data;
}

export async function confirmarReservaSaida(id: number) {
  const { data } = await api.post<MovementDto>(`/exits/reservations/${id}/confirm`);
  return saidaFromDto(data);
}

export async function cancelarReservaSaida(id: number) {
  const { data } = await api.post<StockReservationDto>(`/exits/reservations/${id}/cancel`);
  return data;
}

function reposicaoFromDto(item: ReplenishmentDto): Reposicao {
  return {
    id: item.id,
    productId: item.productId,
    sku: item.sku,
    produto: item.product,
    quantidade: item.quantity,
    recebida: item.quantityReceived,
    status: item.status,
    agendadaEm: item.scheduledAt,
    concluidaEm: item.completedAt,
    registradaPor: item.registeredBy,
  };
}

export async function listarReposicoes() {
  const { data } = await api.get<ReplenishmentDto[]>('/replenishments');
  return data.map(reposicaoFromDto);
}

export async function agendarReposicao(productId: number, quantity: number) {
  const { data } = await api.post<ReplenishmentDto>('/replenishments', { productId, quantity });
  return reposicaoFromDto(data);
}
