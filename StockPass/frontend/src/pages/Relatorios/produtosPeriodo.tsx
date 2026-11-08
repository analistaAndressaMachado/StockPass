export type StatusEstoque = 'Repor agora' | 'Estoque baixo' | 'Monitorar' | 'Sem estoque' | 'OK';

export type ProdutoRelatorio = {
  id: number;
  sku: string;
  produto: string;
  fornecedor: string;
  status: StatusEstoque;
  reposicaoStatus: 'Reposição agendada' | 'Reposição feita' | null;
  entradasPeriodo: number;
  saidasPeriodo: number;
  estoqueAtual: number;
  pontoReposicao: number;
  quantidadeSugerida: number;
  tendencia: number[];
};

export function statusEstoque(quantidade: number, pontoReposicao: number): StatusEstoque {
  if (quantidade <= 0) return 'Sem estoque';
  if (pontoReposicao <= 0) return 'OK';
  if (quantidade <= Math.max(1, Math.ceil(pontoReposicao * 0.25))) return 'Repor agora';
  if (quantidade < pontoReposicao) return 'Estoque baixo';
  if (quantidade <= Math.ceil(pontoReposicao * 1.25)) return 'Monitorar';
  return 'OK';
}

export function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  if (status === 'Reposição agendada') return 'badge badge-blue';
  if (status === 'Reposição feita') return 'badge badge-green';
  return 'badge badge-green';
}

export function pontosParaLinha(valores: number[], largura: number, altura: number) {
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const range = max - min || 1;
  const passo = largura / Math.max(valores.length - 1, 1);

  return valores.map((valor, indice) => {
    const x = indice * passo;
    const y = altura - ((valor - min) / range) * altura;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

