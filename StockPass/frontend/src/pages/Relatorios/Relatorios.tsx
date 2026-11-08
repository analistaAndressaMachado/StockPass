import './Relatorios.css';
import { useEffect, useMemo, useState } from 'react';
import {
  agendarReposicao,
  listarEntradas,
  listarProdutos,
  listarReposicoes,
  listarSaidas,
  mensagemErro,
} from '../../services/stockApi';
import type { Entrada } from '../EntradaEstoque/entradasMock';
import type { Saida } from '../SaidaEstoque/saidasMock';
import type { Produto } from '../../types';
import { statusEstoque } from './produtosPeriodo';
import type { ProdutoRelatorio } from './produtosPeriodo';
import { ProdutosPeriodoTabela } from './ProdutosPeriodoTabela';
import { TodosProdutosModal } from './TodosProdutosModal';

type Periodo = 'semana' | 'mes';
type Props = {
  onReceiveReplenishment: (replenishment: { productId: number; quantity: number; replenishmentId: number }) => void;
};

const STATUS_SERIES = [
  { key: 'Repor agora', color: '#c83d4d' },
  { key: 'Estoque baixo', color: '#e17b35' },
  { key: 'Monitorar', color: '#b28a1c' },
  { key: 'Sem estoque', color: '#596672' },
  { key: 'Reposição agendada', color: '#3478bd' },
  { key: 'Reposição feita', color: '#2e8b57' },
  { key: 'OK', color: '#169a9a' },
] as const;

type Point = { date: Date; label: string; values: Record<string, number> };

function datasDoPeriodo(periodo: Periodo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje);
  if (periodo === 'semana') inicio.setDate(inicio.getDate() - 6);
  else inicio.setDate(1);
  const datas: Date[] = [];
  for (const data = new Date(inicio); data <= hoje; data.setDate(data.getDate() + 1)) {
    datas.push(new Date(data));
  }
  return { inicio, hoje, datas };
}

function dentroDoPeriodo(dataIso: string, inicio: Date, fim: Date) {
  const data = new Date(dataIso);
  return data >= inicio && data < fim;
}

function construirTendencia(
  produtos: Produto[],
  entradas: Entrada[],
  saidas: Saida[],
  reposicoes: Awaited<ReturnType<typeof listarReposicoes>>,
  datas: Date[],
  inicioPeriodo: Date,
): Point[] {
  return datas.map((dia) => {
    const fimDoDia = new Date(dia);
    fimDoDia.setHours(23, 59, 59, 999);
    const valores: Record<string, number> = Object.fromEntries(STATUS_SERIES.map(({ key }) => [key, 0]));

    for (const produto of produtos) {
      const entradaDepois = entradas
        .filter((movimento) => movimento.sku === produto.sku && new Date(movimento.dataHora) > fimDoDia)
        .reduce((total, movimento) => total + movimento.quantidade, 0);
      const saidaDepois = saidas
        .filter((movimento) => movimento.sku === produto.sku && new Date(movimento.dataHora) > fimDoDia)
        .reduce((total, movimento) => total + movimento.quantidade, 0);
      const saldoNoDia = Math.max(0, produto.quantidade - entradaDepois + saidaDepois);
      valores[statusEstoque(saldoNoDia, produto.pontoReposicao)] += 1;

      const agendamentoAtivo = reposicoes.some((reposicao) =>
        reposicao.sku === produto.sku &&
        new Date(reposicao.agendadaEm) <= fimDoDia &&
        (!reposicao.concluidaEm || new Date(reposicao.concluidaEm) > fimDoDia));
      if (agendamentoAtivo) valores['Reposição agendada'] += 1;
    }

    valores['Reposição feita'] = reposicoes.filter((reposicao) =>
      reposicao.concluidaEm &&
      new Date(reposicao.concluidaEm) >= inicioPeriodo &&
      new Date(reposicao.concluidaEm) <= fimDoDia).length;

    return {
      date: dia,
      label: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      values: valores,
    };
  });
}

function pontosStatus(tendencia: Point[], status: string, maximo: number) {
  const largura = 680;
  const altura = 170;
  const passo = largura / Math.max(tendencia.length - 1, 1);
  return tendencia.map((ponto, indice) => {
    const x = 48 + indice * passo;
    const y = 188 - (ponto.values[status] / Math.max(maximo, 1)) * altura;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

type RelatorioProps = Props;

export function Relatorios({ onReceiveReplenishment }: RelatorioProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [showTodos, setShowTodos] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [reposicoes, setReposicoes] = useState<Awaited<ReturnType<typeof listarReposicoes>>>([]);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [agendandoSku, setAgendandoSku] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const atualizar = async () => {
      try {
        const [catalogo, historicoEntradas, historicoSaidas] = await Promise.all([
          listarProdutos(), listarEntradas(), listarSaidas(),
        ]);
        if (!ativo) return;
        let historicoReposicoes: Awaited<ReturnType<typeof listarReposicoes>> = [];
        let erroReposicoes = '';
        try {
          historicoReposicoes = await listarReposicoes();
        } catch (error) {
          erroReposicoes = `Movimentações carregadas; ${mensagemErro(error)}`;
        }
        if (!ativo) return;
        setProdutos(catalogo);
        setEntradas(historicoEntradas);
        setSaidas(historicoSaidas);
        setReposicoes(historicoReposicoes);
        setAtualizadoEm(new Date());
        setErro(erroReposicoes);
      } catch (error) {
        if (ativo) setErro(mensagemErro(error));
      }
    };
    void atualizar();
    const intervalo = window.setInterval(atualizar, 15000);
    const aoVoltar = () => { if (document.visibilityState === 'visible') void atualizar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, []);

  const { inicio, hoje, datas } = useMemo(() => datasDoPeriodo(periodo), [periodo]);
  const fimPeriodo = new Date(hoje);
  fimPeriodo.setDate(fimPeriodo.getDate() + 1);
  const entradasPeriodo = entradas.filter((entrada) => dentroDoPeriodo(entrada.dataHora, inicio, fimPeriodo));
  const saidasPeriodo = saidas.filter((saida) => dentroDoPeriodo(saida.dataHora, inicio, fimPeriodo));
  const reposicoesPeriodo = reposicoes.filter((reposicao) =>
    dentroDoPeriodo(reposicao.agendadaEm, inicio, fimPeriodo) ||
    (reposicao.concluidaEm && dentroDoPeriodo(reposicao.concluidaEm, inicio, fimPeriodo)));

  const produtosRelatorio = useMemo(() => {
    const movimentados = new Set([
      ...entradasPeriodo.map((item) => item.sku),
      ...saidasPeriodo.map((item) => item.sku),
      ...reposicoesPeriodo.map((item) => item.sku),
      ...produtos.filter((produto) => statusEstoque(produto.quantidade, produto.pontoReposicao) !== 'OK')
        .map((produto) => produto.sku),
    ]);

    return produtos.filter((produto) => movimentados.has(produto.sku)).map((produto): ProdutoRelatorio => {
      const entradasProduto = entradasPeriodo.filter((item) => item.sku === produto.sku);
      const saidasProduto = saidasPeriodo.filter((item) => item.sku === produto.sku);
      const reposicoesProduto = reposicoes.filter((item) => item.sku === produto.sku);
      const agendada = reposicoesProduto.find((item) => item.status === 'SCHEDULED');
      const concluidaNoPeriodo = reposicoesProduto.find((item) =>
        item.status === 'COMPLETED' && item.concluidaEm && dentroDoPeriodo(item.concluidaEm, inicio, fimPeriodo));
      const saldoStatus = statusEstoque(produto.quantidade, produto.pontoReposicao);
      return {
        id: produto.id,
        sku: produto.sku,
        produto: produto.nome,
        fornecedor: produto.fornecedor,
        status: saldoStatus,
        reposicaoStatus: agendada ? 'Reposição agendada' : concluidaNoPeriodo ? 'Reposição feita' : null,
        entradasPeriodo: entradasProduto.reduce((total, item) => total + item.quantidade, 0),
        saidasPeriodo: saidasProduto.reduce((total, item) => total + item.quantidade, 0),
        estoqueAtual: produto.quantidade,
        pontoReposicao: produto.pontoReposicao,
        quantidadeSugerida: Math.max(1, produto.pontoReposicao - produto.quantidade),
        tendencia: datas.map((dia) => {
          const fimDoDia = new Date(dia);
          fimDoDia.setHours(23, 59, 59, 999);
          const entradaDepois = entradas.filter((item) => item.sku === produto.sku && new Date(item.dataHora) > fimDoDia)
            .reduce((total, item) => total + item.quantidade, 0);
          const saidaDepois = saidas.filter((item) => item.sku === produto.sku && new Date(item.dataHora) > fimDoDia)
            .reduce((total, item) => total + item.quantidade, 0);
          return Math.max(0, produto.quantidade - entradaDepois + saidaDepois);
        }),
      };
    });
  }, [produtos, entradas, saidas, reposicoes, entradasPeriodo, saidasPeriodo, reposicoesPeriodo, inicio, fimPeriodo, datas]);

  const tendencia = useMemo(() => construirTendencia(produtos, entradas, saidas, reposicoes, datas, inicio),
    [produtos, entradas, saidas, reposicoes, datas, inicio]);
  const totalEntradas = entradasPeriodo.reduce((total, item) => total + item.quantidade, 0);
  const totalSaidas = saidasPeriodo.reduce((total, item) => total + item.quantidade, 0);
  const valorEstoque = produtos.reduce((total, produto) => total + produto.quantidade * produto.preco, 0);
  const criticos = produtos.filter((produto) => ['Repor agora', 'Estoque baixo', 'Sem estoque'].includes(
    statusEstoque(produto.quantidade, produto.pontoReposicao))).length;
  const maximoGrafico = Math.max(1, ...tendencia.flatMap((ponto) => STATUS_SERIES.map(({ key }) => ponto.values[key])));
  const maximoEscala = Math.ceil(maximoGrafico / 2) * 2 || 1;

  async function agendar(produto: ProdutoRelatorio) {
    setAgendandoSku(produto.sku);
    try {
      await agendarReposicao(produto.id, produto.quantidadeSugerida);
      const dados = await listarReposicoes();
      setReposicoes(dados);
      setErro('');
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setAgendandoSku(null);
    }
  }

  function receber(produto: ProdutoRelatorio) {
    const agendada = reposicoes.find((item) => item.sku === produto.sku && item.status === 'SCHEDULED');
    if (!agendada) return;
    onReceiveReplenishment({
      productId: produto.id,
      quantity: agendada.quantidade - agendada.recebida,
      replenishmentId: agendada.id,
    });
  }

  return (
    <div className="relatorios">
      <section className="panel-card panel-card--soft-padrao relatorios-filtro">
        <div>
          <h2>Relatórios</h2>
          <p className="muted-sm">Movimentações, saldo e reposições do período atualizados automaticamente</p>
        </div>

        <label className="filtro-periodo">
          Período
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Este mês</option>
          </select>
        </label>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total de Entradas</span>
          <p className="stat-value">{totalEntradas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Unidades recebidas no período</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total de Saídas</span>
          <p className="stat-value">{totalSaidas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Unidades retiradas no período</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Valor em Estoque</span>
          <p className="stat-value">{valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="stat-hint">Baseado no preço de venda</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Produtos Críticos</span>
            <span className="badge badge-red">Crítico</span>
          </div>
          <p className="stat-value">{criticos}</p>
          <p className="stat-hint">Abaixo do ponto de reposição</p>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao">
        <h2>Tendência do período</h2>
        <p className="muted-sm">Quantidade de produtos por status no fechamento de cada dia</p>
        {atualizadoEm && <p className="relatorios-atualizado">Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}</p>}
        {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}

        <div className="grafico-tendencia">
          <svg
            viewBox="0 0 760 230"
            className="tendencia-svg"
            role="img"
            aria-label="Tendência diária do número de produtos por status de estoque e reposição"
          >
            {[0, 1, 2].map((nivel) => {
              const valor = Math.round(maximoEscala * nivel / 2);
              const y = 188 - (valor / maximoEscala) * 170;
              return <g key={nivel}>
                <line x1="48" x2="728" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x="36" y={y + 4} textAnchor="end" className="eixo-grafico-label">{valor}</text>
              </g>;
            })}
            {STATUS_SERIES.map(({ key, color }) => (
              <polyline key={key} points={pontosStatus(tendencia, key, maximoEscala)} fill="none"
                stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {tendencia.map((ponto, indice) => {
              const passo = 680 / Math.max(tendencia.length - 1, 1);
              return <text key={ponto.label} x={48 + indice * passo} y="212" textAnchor="middle" className="eixo-grafico-label">
                {periodo === 'semana' || indice === 0 || indice === tendencia.length - 1 || indice % 5 === 0 ? ponto.label : ''}
              </text>;
            })}
          </svg>

          <div className="grafico-legenda">
            {STATUS_SERIES.map(({ key, color }) => (
              <span className="legenda-item" key={key}>
                <i className="linha-legenda" style={{ backgroundColor: color }} />
                {key} <strong>{tendencia[tendencia.length - 1]?.values[key] ?? 0}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao">
        <div className="produtos-periodo-header">
          <div>
            <h2>Produtos no período</h2>
            <p className="muted-sm">Produtos com movimentação ou reposição no período selecionado</p>
          </div>

          <button className="btn-primary" onClick={() => setShowTodos(true)}>
            Ver todos
          </button>
        </div>

        <ProdutosPeriodoTabela
          produtos={produtosRelatorio.slice(0, 5)}
          onSchedule={agendar}
          onReceive={receber}
          schedulingSku={agendandoSku}
        />
        {produtosRelatorio.length === 0 && <p className="muted-sm">Nenhum produto movimentado no período.</p>}
      </section>

      {showTodos && <TodosProdutosModal
        produtos={produtosRelatorio}
        onClose={() => setShowTodos(false)}
        onSchedule={agendar}
        onReceive={receber}
        schedulingSku={agendandoSku}
      />}
    </div>
  );
}