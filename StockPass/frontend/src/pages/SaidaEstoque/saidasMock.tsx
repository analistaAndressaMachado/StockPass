import { ITENS_INICIAIS } from '../Painel/TodosItensModal';

// As funções de data (formatarDataHora, ehHoje...) já existem na tela de
// Entrada, então reaproveitamos daqui. Futuramente dá pra mover essas funções
// pra um arquivo comum (ex: utils/datas) usado pelas duas telas.
export { formatarDataHora, formatarHora, ehHoje, nomeDoDia } from '../EntradaEstoque/entradasMock';

// ======================================================================
// DADOS MOCKADOS — só existem no frontend. Quando existir o backend de
// Movimentação, o histórico vai vir de algo como GET /api/saidas e a
// data/hora e o usuário vão ser gravados automaticamente pelo servidor.
// Lembrar de atualizar o StockPass-itens-temporarios.md quando resolver.
// ======================================================================

export type Saida = {
  id: number;
  dataHora: string; // data e hora em formato ISO
  sku: string;
  produto: string;
  quantidade: number;
  motivo: string;
  registradoPor: string;
  observacao: string;
};

export const MOTIVOS_SAIDA = ['Venda', 'Perda', 'Devolução', 'Outro'];

// Produtos que aparecem na lista de "Registrar Saída". "disponivel" é o
// estoque atual do produto (de mentira, vem do mock do Painel).
export const PRODUTOS_SAIDA = ITENS_INICIAIS.map((i) => ({
  sku: i.sku,
  nome: i.produto,
  disponivel: i.atual,
}));

const USUARIOS = ['Admin', 'Gestor', 'Henry', 'Mariana', 'Andressa'];
const MOTIVOS_SORTEIO = ['Venda', 'Venda', 'Venda', 'Perda', 'Venda', 'Devolução', 'Venda', 'Outro'];
const OBSERVACOES: Record<string, string> = {
  Perda: 'Item danificado',
  Devolução: 'Devolvido ao fornecedor',
  Outro: 'Uso interno',
};

// Histórico inventado, sempre "relativo a agora". Mais recente primeiro.
export const SAIDAS_INICIAIS: Saida[] = Array.from({ length: 34 }, (_, n) => {
  const item = ITENS_INICIAIS[(n * 5 + 3) % ITENS_INICIAIS.length];
  const motivo = MOTIVOS_SORTEIO[n % MOTIVOS_SORTEIO.length];
  return {
    id: n + 1,
    dataHora: new Date(Date.now() - (1 + n * 8 + (n % 4) * 2) * 60 * 60 * 1000).toISOString(),
    sku: item.sku,
    produto: item.produto,
    quantidade: 1 + ((n * 11) % 40),
    motivo,
    registradoPor: USUARIOS[(n + 2) % USUARIOS.length],
    observacao: OBSERVACOES[motivo] ?? '',
  };
});

export function motivoClass(motivo: string) {
  if (motivo === 'Venda') return 'badge badge-green';
  if (motivo === 'Perda') return 'badge badge-red';
  if (motivo === 'Devolução') return 'badge badge-yellow';
  return 'badge badge-blue';
}