export type AccessLevel = 'nenhum' | 'ver' | 'editar';
export type User={id:number;name:string;email:string;role:string;companyName?:string|null;taxId?:string|null;phone?:string|null;photoUrl?:string|null;permissions?:Record<string,AccessLevel>};
export type AuthResponse={token:string;user:User};

export type Produto = {
  id: number;
  sku: string;
  categoryId: number;
  nome: string;
  categoria: string;
  quantidade: number;
  preco: number;
  fornecedor: string;
  pontoReposicao: number;
  active: boolean;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type ReservaSaida = {
  id: number;
  productId: number;
  sku: string;
  product: string;
  quantity: number;
  reason: string;
  observation: string | null;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: string;
};

