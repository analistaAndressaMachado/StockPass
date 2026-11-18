import { useMemo, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import type { Entrada } from '../EntradaEstoque/entradasMock';
import type { Saida } from '../SaidaEstoque/saidasMock';
import type { ProdutoRelatorio } from './produtosPeriodo';

type Movimento = {
  id: number;
  dataHora: string;
  tipo: 'Entrada' | 'Saída';
  quantidade: number;
  responsavel: string;
  detalhe: string;
};

type Ordem = 'recentes' | 'antigas';
type TipoFiltro = 'todos' | 'entrada' | 'saida';
type PeriodoFiltro = 'tudo' | 'dia' | 'semana' | 'mes' | 'ano';

type PontoGrafico = { chave: number; data: Date; granularidade: Granularidade; rotulo: string; entradas: number; saidas: number };
type Granularidade = 'hora' | 'dia' | 'semana' | 'mes';

function inicioDoPeriodo(data: Date, granularidade: Granularidade) {
  const inicio = new Date(data);
  if (granularidade === 'hora') inicio.setMinutes(0, 0, 0);
  else if (granularidade === 'dia') inicio.setHours(0, 0, 0, 0);
  else if (granularidade === 'semana') {
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  }
  else {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
  }
  return inicio;
}

function proximoPeriodo(data: Date, granularidade: Granularidade) {
  const proximo = new Date(data);
  if (granularidade === 'hora') proximo.setHours(proximo.getHours() + 1);
  else if (granularidade === 'dia') proximo.setDate(proximo.getDate() + 1);
  else if (granularidade === 'semana') proximo.setDate(proximo.getDate() + 7);
  else proximo.setMonth(proximo.getMonth() + 1);
  return proximo;
}

function rotuloDoPeriodo(data: Date, granularidade: Granularidade) {
  if (granularidade === 'hora') return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (granularidade === 'dia') return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (granularidade === 'semana') return `Sem. ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function construirPontosGrafico(movimentos: Movimento[]): PontoGrafico[] {
  if (movimentos.length === 0) return [];
  const extremos = movimentos.reduce((resultado, movimento) => {
    const instante = new Date(movimento.dataHora).getTime();
    return { minimo: Math.min(resultado.minimo, instante), maximo: Math.max(resultado.maximo, instante) };
  }, { minimo: Number.POSITIVE_INFINITY, maximo: Number.NEGATIVE_INFINITY });
  const intervaloMs = extremos.maximo - extremos.minimo;
  let granularidade: Granularidade = intervaloMs <= 2 * 24 * 60 * 60 * 1000 ? 'hora'
    : intervaloMs <= 60 * 24 * 60 * 60 * 1000 ? 'dia'
      : intervaloMs <= 365 * 24 * 60 * 60 * 1000 ? 'semana' : 'mes';
  const criarPontos = (passo: Granularidade) => {
    const inicio = inicioDoPeriodo(new Date(extremos.minimo), passo);
    const fim = inicioDoPeriodo(new Date(extremos.maximo), passo);
    const resultado: PontoGrafico[] = [];
    for (let data = new Date(inicio); data <= fim; data = proximoPeriodo(data, passo)) {
      resultado.push({ chave: data.getTime(), data: new Date(data), granularidade: passo, rotulo: rotuloDoPeriodo(data, passo), entradas: 0, saidas: 0 });
    }
    return resultado;
  };
  let pontos = criarPontos(granularidade);
  if (pontos.length < 8 && granularidade === 'dia') {
    granularidade = 'hora';
    pontos = criarPontos(granularidade);
  } else if (pontos.length < 8 && granularidade === 'semana') {
    granularidade = 'dia';
    pontos = criarPontos(granularidade);
  }
  const porChave = new Map(pontos.map((ponto) => [ponto.chave, ponto]));
  for (const movimento of movimentos) {
    const chave = inicioDoPeriodo(new Date(movimento.dataHora), granularidade).getTime();
    const ponto = porChave.get(chave);
    if (!ponto) continue;
    if (movimento.tipo === 'Entrada') ponto.entradas += movimento.quantidade;
    else ponto.saidas += movimento.quantidade;
  }
  return pontos;
}

function escalaBonita(maximo: number) {
  if (maximo <= 0) return { teto: 1, passo: 0.25 };
  if (maximo <= 5) return { teto: Math.ceil(maximo), passo: 1 };
  const passoBruto = maximo / 5;
  const magnitude = 10 ** Math.floor(Math.log10(passoBruto));
  const fracao = passoBruto / magnitude;
  const bonito = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;
  const passo = bonito * magnitude;
  return { teto: Math.ceil(maximo / passo) * passo, passo };
}

function curvaSuave(pontos: Array<{ x: number; y: number }>, base: number) {
  if (pontos.length === 1) {
    const ponto = pontos[0];
    return `M ${ponto.x - 24} ${base} Q ${ponto.x - 12} ${ponto.y} ${ponto.x} ${ponto.y} Q ${ponto.x + 12} ${ponto.y} ${ponto.x + 24} ${base}`;
  }
  if (pontos.length < 3) return pontos.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'} ${ponto.x} ${ponto.y}`).join(' ');
  let caminho = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let indice = 1; indice < pontos.length - 1; indice += 1) {
    const meioX = (pontos[indice].x + pontos[indice + 1].x) / 2;
    const meioY = (pontos[indice].y + pontos[indice + 1].y) / 2;
    caminho += ` Q ${pontos[indice].x} ${pontos[indice].y} ${meioX} ${meioY}`;
  }
  const ultimo = pontos[pontos.length - 1];
  caminho += ` Q ${ultimo.x} ${ultimo.y} ${ultimo.x} ${ultimo.y}`;
  return caminho;
}

function caminhoArea(pontos: Array<{ x: number; y: number }>, base: number) {
  if (pontos.length === 1) return `${curvaSuave(pontos, base)} Z`;
  return `${curvaSuave(pontos, base)} L ${pontos[pontos.length - 1].x} ${base} L ${pontos[0].x} ${base} Z`;
}

type Props = {
  produto: ProdutoRelatorio;
  entradas: Entrada[];
  saidas: Saida[];
  onClose: () => void;
};

export function HistoricoProdutoModal({ produto, entradas, saidas, onClose }: Props) {
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('tudo');

  const movimentos = useMemo<Movimento[]>(() => {
    const todos: Movimento[] = [
    ...entradas.map((item) => ({
      id: item.id,
      dataHora: item.dataHora,
      tipo: 'Entrada' as const,
      quantidade: item.quantidade,
      responsavel: item.registradoPor,
      detalhe: item.notaFiscal ? `Nota fiscal: ${item.notaFiscal}` : item.fornecedor,
    })),
    ...saidas.map((item) => ({
      id: item.id,
      dataHora: item.dataHora,
      tipo: 'Saída' as const,
      quantidade: item.quantidade,
      responsavel: item.registradoPor,
      detalhe: item.motivo || item.observacao,
    })),
    ];
    const agora = new Date();
    const desde = new Date(agora);
    switch (periodoFiltro) {
      case 'dia': desde.setDate(desde.getDate() - 1); break;
      case 'semana': desde.setDate(desde.getDate() - 7); break;
      case 'mes': desde.setMonth(desde.getMonth() - 1); break;
      case 'ano': desde.setFullYear(desde.getFullYear() - 1); break;
      case 'tudo': break;
    }

    return todos
      .filter((movimento) => periodoFiltro === 'tudo' || new Date(movimento.dataHora) >= desde)
      .filter((movimento) => tipoFiltro === 'todos' ||
        (tipoFiltro === 'entrada' ? movimento.tipo === 'Entrada' : movimento.tipo === 'Saída'))
      .sort((a, b) => ordem === 'recentes'
        ? new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
        : new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
  }, [entradas, saidas, ordem, tipoFiltro, periodoFiltro]);
  const pontosGrafico = useMemo(() => construirPontosGrafico(movimentos), [movimentos]);
  const totalEntradas = movimentos.reduce((total, movimento) => total + (movimento.tipo === 'Entrada' ? movimento.quantidade : 0), 0);
  const totalSaidas = movimentos.reduce((total, movimento) => total + (movimento.tipo === 'Saída' ? movimento.quantidade : 0), 0);
  const saldo = totalEntradas - totalSaidas;
  const precoUnitarioValido = Number.isFinite(produto.precoUnitario) && produto.precoUnitario >= 0;
  const valorEstimadoSaidas = totalSaidas * produto.precoUnitario;
  const escalaGrafico = escalaBonita(Math.max(0, ...pontosGrafico.flatMap((ponto) => [ponto.entradas, ponto.saidas])));
  const topoGrafico = 28;
  const baseGrafico = 218;
  const alturaGrafico = baseGrafico - topoGrafico;
  const coordenadasEntradas = pontosGrafico.map((ponto, indice) => ({
    x: pontosGrafico.length === 1 ? 400 : 70 + (indice * 654) / (pontosGrafico.length - 1),
    y: baseGrafico - (ponto.entradas / escalaGrafico.teto) * alturaGrafico,
  }));
  const coordenadasSaidas = pontosGrafico.map((ponto, indice) => ({
    x: pontosGrafico.length === 1 ? 400 : 70 + (indice * 654) / (pontosGrafico.length - 1),
    y: baseGrafico - (ponto.saidas / escalaGrafico.teto) * alturaGrafico,
  }));
  const quantidadeMarcas = Math.round(escalaGrafico.teto / escalaGrafico.passo);

  return (
    <Modal title={`Histórico de ${produto.produto}`} onClose={onClose} size="large">
      <div>
        <div className="todos-itens-toolbar" style={{ marginBottom: 14 }}>
          <div className="saida-filtros" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="filtro-periodo">
            Ordenar
            <select value={ordem} onChange={(event) => setOrdem(event.target.value as Ordem)}>
              <option value="recentes">Mais recentes primeiro</option>
              <option value="antigas">Mais antigas primeiro</option>
            </select>
          </label>
          <label className="filtro-periodo">
            Tipo
            <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value as TipoFiltro)}>
              <option value="todos">Todos</option>
              <option value="entrada">Só entradas</option>
              <option value="saida">Só saídas</option>
            </select>
          </label>
          <label className="filtro-periodo">
            Período
            <select value={periodoFiltro} onChange={(event) => setPeriodoFiltro(event.target.value as PeriodoFiltro)}>
              <option value="tudo">Tudo</option>
              <option value="dia">Último dia</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mês</option>
              <option value="ano">Último ano</option>
            </select>
          </label>
          </div>
          <span className="muted-sm">{movimentos.length} {movimentos.length === 1 ? 'movimento exibido' : 'movimentos exibidos'}</span>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total de entradas</span>
            <p className="stat-value">{totalEntradas.toLocaleString('pt-BR')}</p>
            <p className="stat-hint">Unidades no período filtrado</p>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total de saídas</span>
            <p className="stat-value">{totalSaidas.toLocaleString('pt-BR')}</p>
            <p className="stat-hint">Unidades no período filtrado</p>
          </div>
          <div className="stat-card">
            <span className="stat-label">Saldo</span>
            <p className="stat-value">{saldo.toLocaleString('pt-BR')}</p>
            <p className="stat-hint">Entradas menos saídas</p>
          </div>
          {precoUnitarioValido && <div className="stat-card">
            <span className="stat-label">Valor estimado das saídas</span>
            <p className="stat-value">{valorEstimadoSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="stat-hint">Estimativa pelo preço atual do catálogo. Não é lucro: não há custo nem preço por movimentação.</p>
          </div>}
        </div>
        {pontosGrafico.length === 0 ? (
          <p className="muted-sm">Não há movimentos para exibir no gráfico neste período e tipo.</p>
        ) : (
          <div className="grafico-tendencia" style={{ marginBottom: 18 }}>
            <svg viewBox="0 0 760 270" className="tendencia-svg" style={{ height: 270 }} role="img"
              aria-label={`Entradas e saídas de ${produto.produto} agrupadas por data em intervalos adaptativos`}>
              {Array.from({ length: quantidadeMarcas + 1 }, (_, nivel) => {
                const valor = nivel * escalaGrafico.passo;
                const y = baseGrafico - (valor / escalaGrafico.teto) * alturaGrafico;
                return <g key={nivel}>
                  <line x1="70" x2="730" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                  <text x="58" y={y + 4} textAnchor="end" className="eixo-grafico-label">{valor.toLocaleString('pt-BR')}</text>
                </g>;
              })}
              <path d={caminhoArea(coordenadasSaidas, baseGrafico)} fill="#ea580c" fillOpacity="0.2" />
              <path d={caminhoArea(coordenadasEntradas, baseGrafico)} fill="#2563eb" fillOpacity="0.22" />
              <path d={curvaSuave(coordenadasSaidas, baseGrafico)} fill="none" stroke="#ea580c" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
              <path d={curvaSuave(coordenadasEntradas, baseGrafico)} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
              {pontosGrafico.map((ponto, indice) => {
                const x = coordenadasEntradas[indice].x;
                const yEntrada = coordenadasEntradas[indice].y;
                const ySaida = coordenadasSaidas[indice].y;
                const dataTooltip = ponto.granularidade === 'hora'
                  ? ponto.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit' })
                  : ponto.granularidade === 'mes'
                    ? ponto.data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : ponto.granularidade === 'semana'
                      ? `Semana de ${ponto.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                      : ponto.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                const dica = `${dataTooltip} · Entradas: ${ponto.entradas} · Saídas: ${ponto.saidas}`;
                return <g key={ponto.chave}>
                  <circle cx={x} cy={ySaida} r="4" fill="#ea580c"><title>{dica}</title></circle>
                  <circle cx={x} cy={yEntrada} r="4" fill="#2563eb"><title>{dica}</title></circle>
                  {(pontosGrafico.length <= 8 || indice === 0 || indice === pontosGrafico.length - 1 || indice % Math.ceil(pontosGrafico.length / 7) === 0) &&
                    <text x={x} y="244" textAnchor="middle" className="eixo-grafico-label">{ponto.rotulo}</text>}
                </g>;
              })}
            </svg>
            <div className="grafico-legenda">
              <span className="legenda-item"><i className="linha-legenda" style={{ backgroundColor: '#2563eb' }} />Entradas</span>
              <span className="legenda-item"><i className="linha-legenda" style={{ backgroundColor: '#ea580c' }} />Saídas</span>
            </div>
          </div>
        )}
        {movimentos.length === 0 ? (
          <p className="muted-sm">Não há movimentos registrados para este produto.</p>
        ) : (
          <div className="todos-itens-table-wrap">
            <table className="table">
              <thead>
                <tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Responsável</th><th>Detalhe</th></tr>
              </thead>
              <tbody>
                {movimentos.map((movimento) => (
                  <tr key={`${movimento.tipo}-${movimento.id}`}>
                    <td>{new Date(movimento.dataHora).toLocaleString('pt-BR')}</td>
                    <td>{movimento.tipo}</td>
                    <td>{movimento.quantidade}</td>
                    <td>{movimento.responsavel}</td>
                    <td>{movimento.detalhe || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
