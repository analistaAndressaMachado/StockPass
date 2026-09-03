export type Product = {
  id: number;
  code: string;
  name: string;
  description?: string;
  quantity: number;
  minimum_stock: number;
  expiration_date?: string;
  photo_url?: string | null;
  category?: { id: number; name: string };
  supplier?: { id: number; name: string };
};

export type Dashboard = {
  total_produtos: number;
  total_itens: number;
  produtos_estoque_baixo: number;
  alertas_ativos: number;
  movimentacoes: number;
};
