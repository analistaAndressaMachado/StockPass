export type User={id:number;name:string;email:string;role:string};
export type AuthResponse={token:string;user:User};

export type Produto = {
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  preco: number;
  fornecedor: string;
  pontoReposicao: number;
};