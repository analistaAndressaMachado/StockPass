import './Relatorios.css';
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
import { HistoricoProdutoModal } from './HistoricoProdutoModal';
import { Select } from '../../components/Select/Select';

type Periodo = 'semana' | 'mes';
type Props = {
  onReceiveReplenishment: (replenishment: { productId: number; quantity: number; replenishmentId: number }) => void;
};

const MOVIMENTACAO_SERIES = [
  { key: 'entradas', label: 'Entradas', color: '#2563eb' },
  { key: 'saidas', label: 'Saídas', color: '#ea580c' },
] as const;

type Point = { date: Date; label: string; entradas: number; saidas: number };
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

function construirMovimentacao(entradas: Entrada[], saidas: Saida[], datas: Date[]): Point[] {
  return datas.map((dia) => {
    const inicioDia = new Date(dia);
    const fimDia = new Date(dia);
    fimDia.setDate(fimDia.getDate() + 1);
    const somarMovimentos = (movimentos: (Entrada | Saida)[]) => movimentos
      .filter((movimento) => dentroDoPeriodo(movimento.dataHora, inicioDia, fimDia))
      .reduce((total, movimento) => total + movimento.quantidade, 0);

    return {
      date: dia,
      label: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      entradas: somarMovimentos(entradas),
      saidas: somarMovimentos(saidas),
    };
  });
}
type RelatorioProps = Props;

export function Relatorios({ onReceiveReplenishment }: RelatorioProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [showTodos, setShowTodos] = useState(false);
  const [produtoHistorico, setProdutoHistorico] = useState<ProdutoRelatorio | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [reposicoes, setReposicoes] = useState<Awaited<ReturnType<typeof listarReposicoes>>>([]);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [agendandoSku, setAgendandoSku] = useState<string | null>(null);
  const [tooltipMovimentacao, setTooltipMovimentacao] = useState<{
    ponto: Point;
    x: number;
    y: number;
  } | null>(null);

  function posicionarTooltip(event: ReactMouseEvent<SVGRectElement>, ponto: Point) {
    const grafico = event.currentTarget.closest('.grafico-tendencia');
    if (!grafico) return;
    const limites = grafico.getBoundingClientRect();
    setTooltipMovimentacao({
      ponto,
      x: Math.max(8, Math.min(Math.max(8, limites.width - 180), event.clientX - limites.left + 10)),
      y: Math.max(120, event.clientY - limites.top),
    });
  }

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
        precoUnitario: produto.preco,
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

  const movimentacao = useMemo(() => construirMovimentacao(entradas, saidas, datas), [entradas, saidas, datas]);
  const totalEntradas = entradasPeriodo.reduce((total, item) => total + item.quantidade, 0);
  const totalSaidas = saidasPeriodo.reduce((total, item) => total + item.quantidade, 0);
  const valorEstoque = produtos.reduce((total, produto) => total + produto.quantidade * produto.preco, 0);
  const criticos = produtos.filter((produto) => ['Repor agora', 'Estoque baixo', 'Sem estoque'].includes(
    statusEstoque(produto.quantidade, produto.pontoReposicao))).length;
  const maximoGrafico = Math.max(0, ...movimentacao.flatMap((ponto) => [ponto.entradas, ponto.saidas]));
  const maximoEscala = Math.max(1, maximoGrafico);
  const passoGrafico = 680 / Math.max(movimentacao.length, 1);
  const larguraBarra = Math.min(24, passoGrafico * 0.28);
  const espacamentoBarras = Math.min(5, passoGrafico * 0.08);

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

        <div className="filtro-periodo">
          <span>Período</span>
          <Select<Periodo>
            ariaLabel="Período"
            options={[
              { value: 'semana', label: 'Últimos 7 dias' },
              { value: 'mes', label: 'Este mês' },
            ]}
            value={periodo}
            onChange={setPeriodo}
          />
        </div>
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
        <div className="grafico-cabecalho">
          <div>
            <h2>Movimentação de estoque</h2>
            <p className="muted-sm">Unidades que entraram e saíram a cada dia</p>
          </div>
          {atualizadoEm && <p className="relatorios-atualizado">Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}</p>}
        </div>
        {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}

        <div className="grafico-tendencia">
          <svg viewBox="0 0 760 230" className="tendencia-svg" role="img"
            aria-label="Movimentação diária de entradas e saídas de estoque">
            {[0, 1, 2].map((nivel) => {
              const valor = Math.round(maximoEscala * nivel / 2);
              const y = 188 - (valor / maximoEscala) * 170;
              return <g key={nivel}>
                <line x1="48" x2="728" y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x="36" y={y + 4} textAnchor="end" className="eixo-grafico-label">{valor}</text>
              </g>;
            })}
            {movimentacao.map((ponto, indice) => {
              const centro = 48 + passoGrafico * (indice + 0.5);
              const alturaEntrada = (ponto.entradas / maximoEscala) * 170;
              const alturaSaida = (ponto.saidas / maximoEscala) * 170;
              const xEntrada = centro - espacamentoBarras / 2 - larguraBarra;
              const xSaida = centro + espacamentoBarras / 2;
              return <g key={ponto.label}>
                <rect x={xEntrada} y={188 - alturaEntrada} width={larguraBarra} height={alturaEntrada} rx="3" fill={MOVIMENTACAO_SERIES[0].color}
                  onMouseEnter={(event) => posicionarTooltip(event, ponto)}
                  onMouseMove={(event) => posicionarTooltip(event, ponto)}
                  onMouseLeave={() => setTooltipMovimentacao(null)}>
                  <title>{`${ponto.label} - Entradas: ${ponto.entradas} - Saidas: ${ponto.saidas}`}</title>
                </rect>
                <rect x={xSaida} y={188 - alturaSaida} width={larguraBarra} height={alturaSaida} rx="3" fill={MOVIMENTACAO_SERIES[1].color}
                  onMouseEnter={(event) => posicionarTooltip(event, ponto)}
                  onMouseMove={(event) => posicionarTooltip(event, ponto)}
                  onMouseLeave={() => setTooltipMovimentacao(null)}>
                  <title>{`${ponto.label} - Entradas: ${ponto.entradas} - Saidas: ${ponto.saidas}`}</title>
                </rect>
                <text x={centro} y="212" textAnchor="middle" className="eixo-grafico-label">
                  {periodo === 'semana' || indice === 0 || indice === movimentacao.length - 1 || indice % 5 === 0 ? ponto.label : ''}
                </text>
              </g>;
            })}
          </svg>

          <div className="grafico-legenda">
            {MOVIMENTACAO_SERIES.map(({ key, label, color }) => (
              <span className="legenda-item" key={key}>
                <i className="marcador-legenda" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
          {tooltipMovimentacao && <div
            className="grafico-tooltip"
            role="status"
            style={{ left: tooltipMovimentacao.x, top: tooltipMovimentacao.y }}
          >
            <strong className="grafico-tooltip-data">{tooltipMovimentacao.ponto.label}</strong>
            <span className="grafico-tooltip-linha">
              <i className="marcador-legenda" style={{ backgroundColor: MOVIMENTACAO_SERIES[0].color }} />
              Entradas <strong>{tooltipMovimentacao.ponto.entradas.toLocaleString('pt-BR')}</strong>
            </span>
            <span className="grafico-tooltip-linha">
              <i className="marcador-legenda" style={{ backgroundColor: MOVIMENTACAO_SERIES[1].color }} />
              Saídas <strong>{tooltipMovimentacao.ponto.saidas.toLocaleString('pt-BR')}</strong>
            </span>
          </div>}
          {maximoGrafico === 0 && <p className="grafico-sem-movimentacao">Nenhuma entrada ou saída registrada neste período.</p>}
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
          onViewHistory={setProdutoHistorico}
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
        onViewHistory={setProdutoHistorico}
      />}
      {produtoHistorico && <HistoricoProdutoModal
        produto={produtoHistorico}
        entradas={entradas.filter((item) => item.sku === produtoHistorico.sku)}
        saidas={saidas.filter((item) => item.sku === produtoHistorico.sku)}
        onClose={() => setProdutoHistorico(null)}
      />}
    </div>
  );
}
