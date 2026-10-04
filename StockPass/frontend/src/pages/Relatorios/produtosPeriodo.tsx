import { ITENS_INICIAIS } from '../Painel/TodosItensModal';

// ======================================================================
// DADOS MOCKADOS — só existem no frontend. Quando existir o backend de
// Movimentação (entrada/saída), isso vira uma chamada real à API.
// Lembrar de atualizar o StockPass-itens-temporarios.md quando resolver.
// ======================================================================

export type ProdutoRelatorio = {
  sku: string;
  produto: string;
  fornecedor: string;
  status: string;
  entradasPeriodo: number;
  saidasPeriodo: number;
  estoqueAtual: number;
  tendencia: number[];
};

const PRODUTOS_BASE: ProdutoRelatorio[] = [
  {
    sku: 'WB-750-BLK',
    produto: 'Garrafa Reutilizável 750ml',
    fornecedor: 'EcoFlow Supplies',
    status: 'Repor agora',
    entradasPeriodo: 120,
    saidasPeriodo: 142,
    estoqueAtual: 8,
    tendencia: [20, 28, 35, 30, 48, 55, 68, 74, 80],
  },
  {
    sku: 'WM-PRO-GRY',
    produto: 'Mouse Sem Fio Pro',
    fornecedor: 'Digital Gear Ltd',
    status: 'Estoque baixo',
    entradasPeriodo: 60,
    saidasPeriodo: 55,
    estoqueAtual: 15,
    tendencia: [40, 38, 42, 35, 30, 28, 25, 20, 18],
  },
  {
    sku: 'BOX-MED-25',
    produto: 'Caixa de Envio Média',
    fornecedor: 'PackRight',
    status: 'Monitorar',
    entradasPeriodo: 200,
    saidasPeriodo: 180,
    estoqueAtual: 120,
    tendencia: [60, 65, 62, 70, 75, 72, 78, 74, 76],
  },
  {
    sku: 'CAB-USBC-1M',
    produto: 'Cabo de Carregamento USB-C 1m',
    fornecedor: 'Connectix',
    status: 'Sem estoque',
    entradasPeriodo: 30,
    saidasPeriodo: 80,
    estoqueAtual: 0,
    tendencia: [50, 45, 40, 32, 25, 18, 10, 4, 0],
  },
  {
    sku: 'NB-A5-L',
    produto: 'Caderno A5 Pautado',
    fornecedor: 'PaperMill Co.',
    status: 'Reposição agendada',
    entradasPeriodo: 90,
    saidasPeriodo: 68,
    estoqueAtual: 22,
    tendencia: [15, 18, 20, 19, 22, 21, 24, 23, 22],
  },
];

// Provisório: pra ter mais produtos na lista "Ver todos", reaproveitamos os
// 20 produtos de exemplo do Painel e inventamos os números de movimentação.
const PRODUTOS_EXTRAS: ProdutoRelatorio[] = ITENS_INICIAIS.slice(PRODUTOS_BASE.length).map((i, n) => {
  const entradas = i.ponto * 2 + n * 3;
  const saidas = Math.round(entradas * 0.9 + (n % 4) * 6);
  const tendencia = Array.from({ length: 9 }, (_, k) =>
    k === 8
      ? i.atual
      : Math.max(0, Math.round(i.atual + (i.ponto * 1.2 - i.atual) * ((8 - k) / 8) + Math.sin(k + n) * 4)),
  );
  return {
    sku: i.sku,
    produto: i.produto,
    fornecedor: i.fornecedor,
    status: i.status,
    entradasPeriodo: entradas,
    saidasPeriodo: saidas,
    estoqueAtual: i.atual,
    tendencia,
  };
});

export const PRODUTOS_RELATORIO: ProdutoRelatorio[] = [...PRODUTOS_BASE, ...PRODUTOS_EXTRAS];

export function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  return 'badge badge-green';
}

export function pontosParaLinha(valores: number[], largura: number, altura: number) {
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const range = max - min || 1;
  const passo = largura / (valores.length - 1 || 1);

  return valores
    .map((v, i) => {
      const x = i * passo;
      const y = altura - ((v - min) / range) * altura;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}