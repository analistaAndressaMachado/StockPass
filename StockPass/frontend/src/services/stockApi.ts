import { api } from './api';
import axios from 'axios';
import type { Produto } from '../types';
import type { Entrada } from '../pages/EntradaEstoque/entradasMock';
import type { Saida } from '../pages/SaidaEstoque/saidasMock';

type ProductDto = {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  reorderPoint: number;
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

export type NovoProduto = Omit<Produto, 'id' | 'quantidade'> & {
  quantidadeInicial: number;
};

export function mensagemErro(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'Não foi possível conectar à API. Inicie o backend StockPass e tente novamente.';
    if (error.response.status === 403) return 'A API recusou o acesso. Faça login novamente ou reinicie o backend atualizado para habilitar as rotas de reposição.';
    return error.response?.data?.message ?? 'Não foi possível concluir a operação.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

export async function listarProdutos() {
  const { data } = await api.get<ProductDto[]>('/products');
  return data.map((item): Produto => ({
    id: item.id,
    sku: item.sku,
    nome: item.name,
    categoria: item.category,
    quantidade: item.quantity,
    preco: item.price,
    fornecedor: item.supplier,
    pontoReposicao: item.reorderPoint,
  }));
}

export async function criarProduto(produto: NovoProduto) {
  const { data } = await api.post<ProductDto>('/products', {
    sku: produto.sku,
    name: produto.nome,
    category: produto.categoria,
    initialQuantity: produto.quantidadeInicial,
    price: produto.preco,
    supplier: produto.fornecedor,
    reorderPoint: produto.pontoReposicao,
  });
  return {
    id: data.id,
    sku: data.sku,
    nome: data.name,
    categoria: data.category,
    quantidade: data.quantity,
    preco: data.price,
    fornecedor: data.supplier,
    pontoReposicao: data.reorderPoint,
  } satisfies Produto;
}

export async function atualizarProduto(produto: Produto) {
  const { data } = await api.put<ProductDto>(`/products/${produto.id}`, {
    sku: produto.sku,
    name: produto.nome,
    category: produto.categoria,
    price: produto.preco,
    supplier: produto.fornecedor,
    reorderPoint: produto.pontoReposicao,
  });
  return {
    id: data.id,
    sku: data.sku,
    nome: data.name,
    categoria: data.category,
    quantidade: data.quantity,
    preco: data.price,
    fornecedor: data.supplier,
    pontoReposicao: data.reorderPoint,
  } satisfies Produto;
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