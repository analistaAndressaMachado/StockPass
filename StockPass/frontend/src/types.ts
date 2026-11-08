export type User={id:number;name:string;email:string;role:string;companyName?:string|null;taxId?:string|null;phone?:string|null};
export type AuthResponse={token:string;user:User};

export type Produto = {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  preco: number;
  fornecedor: string;
  pontoReposicao: number;
};

