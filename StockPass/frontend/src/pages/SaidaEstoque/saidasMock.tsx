export { formatarDataHora, formatarHora, ehHoje, nomeDoDia } from '../EntradaEstoque/entradasMock';

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

export function motivoClass(motivo: string) {
  if (motivo === 'Venda') return 'badge badge-green';
  if (motivo === 'Perda') return 'badge badge-red';
  if (motivo === 'Devolução') return 'badge badge-yellow';
  return 'badge badge-blue';
}