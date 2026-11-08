import { api } from './api';

export type ProdutoLoja = {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  preco: number;
  disponivel: number;
};

export type ItemCompra = {
  productId: number;
  sku: string;
  produto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

export type CompraCliente = {
  id: number;
  numeroPedido: string;
  total: number;
  metodoPagamento: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
  statusPagamento: 'SIMULATED_PAID';
  criadaEm: string;
  itens: ItemCompra[];
};

export type ClienteCadastrado = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

type ProductDto = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  availableQuantity: number;
};

type PurchaseDto = {
  id: number;
  orderNumber: string;
  total: number;
  paymentMethod: CompraCliente['metodoPagamento'];
  paymentStatus: CompraCliente['statusPagamento'];
  createdAt: string;
  items: {
    productId: number;
    sku: string;
    product: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

function mapProduct(product: ProductDto): ProdutoLoja {
  return {
    id: product.id,
    sku: product.sku,
    nome: product.name,
    categoria: product.category,
    preco: product.price,
    disponivel: product.availableQuantity,
  };
}

function mapPurchase(purchase: PurchaseDto): CompraCliente {
  return {
    id: purchase.id,
    numeroPedido: purchase.orderNumber,
    total: purchase.total,
    metodoPagamento: purchase.paymentMethod,
    statusPagamento: purchase.paymentStatus,
    criadaEm: purchase.createdAt,
    itens: purchase.items.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      produto: item.product,
      quantidade: item.quantity,
      precoUnitario: item.unitPrice,
      subtotal: item.subtotal,
    })),
  };
}

export async function listarProdutosLoja() {
  const { data } = await api.get<ProductDto[]>('/store/products');
  return data.map(mapProduct);
}

export async function finalizarCompraDemonstrativa(
  paymentMethod: CompraCliente['metodoPagamento'],
  items: { productId: number; quantity: number }[],
) {
  const { data } = await api.post<PurchaseDto>('/store/purchases', { paymentMethod, items });
  return mapPurchase(data);
}

export async function listarComprasCliente() {
  const { data } = await api.get<PurchaseDto[]>('/store/purchases');
  return data.map(mapPurchase);
}

export async function listarClientesCadastrados() {
  const { data } = await api.get<ClienteCadastrado[]>('/clients');
  return data;
}

export async function listarComprasDoCliente(clientId: number) {
  const { data } = await api.get<PurchaseDto[]>(`/clients/${clientId}/purchases`);
  return data.map(mapPurchase);
}
