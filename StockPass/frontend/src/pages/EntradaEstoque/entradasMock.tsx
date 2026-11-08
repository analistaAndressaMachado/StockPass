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