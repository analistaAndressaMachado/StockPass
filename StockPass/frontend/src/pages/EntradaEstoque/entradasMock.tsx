import { ITENS_INICIAIS } from '../Painel/TodosItensModal';

// ======================================================================
// DADOS MOCKADOS — só existem no frontend. Quando existir o backend de
// Movimentação, o histórico vai vir de algo como GET /api/entradas e a
// data/hora e o usuário vão ser gravados automaticamente pelo servidor.
// Lembrar de atualizar o StockPass-itens-temporarios.md quando resolver.
// ======================================================================

export type Entrada = {
  id: number;
  dataHora: string; // data e hora em formato ISO (ex: 2026-10-04T14:32:00.000Z)
  sku: string;
  produto: string;
  fornecedor: string;
  quantidade: number;
  registradoPor: string;
  notaFiscal: string;
};

// Produtos que aparecem na lista de "Nova Entrada" (reaproveita os 20 do Painel).
export const PRODUTOS_ENTRADA = ITENS_INICIAIS.map((i) => ({
  sku: i.sku,
  nome: i.produto,
  fornecedor: i.fornecedor,
}));

const USUARIOS = ['Admin', 'Gestor', 'Henry', 'Mariana', 'Andressa'];

// Histórico inventado, sempre "relativo a agora", pra ter entradas de hoje,
// de ontem e dos últimos dias. Ordem: mais recente primeiro.
export const ENTRADAS_INICIAIS: Entrada[] = Array.from({ length: 34 }, (_, n) => {
  const item = ITENS_INICIAIS[(n * 7) % ITENS_INICIAIS.length];
  const horasAtras = 1 + n * 9 + (n % 3) * 2;
  return {
    id: n + 1,
    dataHora: new Date(Date.now() - horasAtras * 60 * 60 * 1000).toISOString(),
    sku: item.sku,
    produto: item.produto,
    fornecedor: item.fornecedor,
    quantidade: 20 + ((n * 37) % 180),
    registradoPor: USUARIOS[n % USUARIOS.length],
    notaFiscal: n % 4 === 0 ? '' : `NF-${4100 + n}`,
  };
});

export function formatarDataHora(iso: string) {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

export function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ehHoje(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function nomeDoDia(iso: string) {
  if (ehHoje(iso)) return 'Hoje';
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (new Date(iso).toDateString() === ontem.toDateString()) return 'Ontem';
  return new Date(iso).toLocaleDateString('pt-BR');
}