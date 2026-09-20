import './Relatorios.css';
import { Fragment, useState } from 'react';

// ======================================================================
// DADOS MOCKADOS — igual ao Painel.tsx, tudo aqui só existe no frontend,
// sem backend de verdade por trás. Quando existir o backend de
// Movimentação (entrada/saída), TROCAR isso por chamadas reais à API
// (algo como GET /api/relatorios?periodo=semana).
// Lembrar de atualizar o StockPass-itens-temporarios.md quando resolver.
// ======================================================================

type Periodo = 'semana' | 'mes';

const RESUMO_POR_PERIODO: Record<Periodo, { entradas: number; saidas: number; valorEstoque: string; produtosCriticos: number }> = {
  semana: { entradas: 342, saidas: 410, valorEstoque: 'R$ 187.590,00', produtosCriticos: 8 },
  mes: { entradas: 1240, saidas: 1382, valorEstoque: 'R$ 187.590,00', produtosCriticos: 8 },
};

// Pontos do gráfico de tendência geral (entradas x saídas) no período.
// É só uma lista de números pra desenhar a linha — nada vem de banco ainda.
const TENDENCIA_POR_PERIODO: Record<Periodo, { entradas: number[]; saidas: number[] }> = {
  semana: {
    entradas: [40, 55, 48, 62, 50, 45, 42],
    saidas: [50, 58, 60, 55, 70, 65, 52],
  },
  mes: {
    entradas: [280, 310, 295, 355],
    saidas: [300, 340, 330, 412],
  },
};

type ProdutoRelatorio = {
  sku: string;
  produto: string;
  fornecedor: string;
  status: string;
  entradasPeriodo: number;
  saidasPeriodo: number;
  estoqueAtual: number;
  tendencia: number[];
};

const PRODUTOS_RELATORIO: ProdutoRelatorio[] = [
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

function statusClass(status: string) {
  if (status === 'Repor agora' || status === 'Sem estoque') return 'badge badge-red';
  if (status === 'Estoque baixo') return 'badge badge-orange';
  if (status === 'Monitorar') return 'badge badge-yellow';
  return 'badge badge-green';
}

function pontosParaLinha(valores: number[], largura: number, altura: number) {
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

export function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [linhaAberta, setLinhaAberta] = useState<string | null>(null);

  const resumo = RESUMO_POR_PERIODO[periodo];
  const tendenciaGeral = TENDENCIA_POR_PERIODO[periodo];

  function toggleLinha(sku: string) {
    setLinhaAberta((atual) => (atual === sku ? null : sku));
  }

  function verHistoricoCompleto(produto: string) {
    alert(`Em breve: histórico completo de "${produto}" (depende da tela de Catálogo).`);
  }

  return (
    <div className="relatorios">
      <section className="panel-card relatorios-filtro">
        <div>
          <h2>Relatórios</h2>
          <p className="muted-sm">Resumo das movimentações de estoque no período selecionado</p>
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
          <p className="stat-value">{resumo.entradas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Unidades recebidas no período</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total de Saídas</span>
          <p className="stat-value">{resumo.saidas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Unidades retiradas no período</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Valor em Estoque</span>
          <p className="stat-value">{resumo.valorEstoque}</p>
          <p className="stat-hint">Baseado no preço de venda</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Produtos Críticos</span>
            <span className="badge badge-red">Crítico</span>
          </div>
          <p className="stat-value">{resumo.produtosCriticos}</p>
          <p className="stat-hint">Abaixo do ponto de reposição</p>
        </div>
      </section>

      <section className="panel-card">
        <h2>Tendência do período</h2>
        <p className="muted-sm">Entradas x saídas ao longo do tempo</p>

        <div className="grafico-tendencia">
          <svg
            viewBox="0 0 600 160"
            className="tendencia-svg"
            role="img"
            aria-label="Gráfico de tendência de entradas e saídas no período"
          >
            <polyline
              points={pontosParaLinha(tendenciaGeral.entradas, 600, 140)}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2}
            />
            <polyline
              points={pontosParaLinha(tendenciaGeral.saidas, 600, 140)}
              fill="none"
              stroke="#ea580c"
              strokeWidth={2}
            />
          </svg>

          <div className="grafico-legenda">
            <span className="legenda-item">
              <i className="ponto ponto-azul" /> Entradas
            </span>
            <span className="legenda-item">
              <i className="ponto ponto-laranja" /> Saídas
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h2>Produtos no período</h2>
        <p className="muted-sm">Clique num produto pra ver o resumo de movimentações dele</p>

        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Produto</th>
              <th>Código do Produto</th>
              <th>Fornecedor</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {PRODUTOS_RELATORIO.map((p) => {
              const aberto = linhaAberta === p.sku;

              return (
                <Fragment key={p.sku}>
                  <tr className="linha-clicavel" onClick={() => toggleLinha(p.sku)}>
                    <td className="col-seta">
                      <span className={`seta ${aberto ? 'seta-aberta' : ''}`}>›</span>
                    </td>
                    <td>{p.produto}</td>
                    <td>{p.sku}</td>
                    <td>{p.fornecedor}</td>
                    <td>
                      <span className={statusClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>

                  {aberto && (
                    <tr className="linha-detalhe">
                      <td colSpan={5}>
                        <div className="mini-stats">
                          <div className="mini-stat">
                            <span className="stat-label">Entradas (período)</span>
                            <p className="stat-value">{p.entradasPeriodo} un</p>
                          </div>
                          <div className="mini-stat">
                            <span className="stat-label">Saídas (período)</span>
                            <p className="stat-value">{p.saidasPeriodo} un</p>
                          </div>
                          <div className="mini-stat">
                            <span className="stat-label">Estoque atual</span>
                            <p className="stat-value">{p.estoqueAtual} un</p>
                          </div>
                        </div>

                        <svg
                          viewBox="0 0 300 60"
                          className="mini-svg"
                          role="img"
                          aria-label={`Tendência de estoque de ${p.produto}`}
                        >
                          <polyline
                            points={pontosParaLinha(p.tendencia, 300, 50)}
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth={2}
                          />
                        </svg>

                        <a
                          className="link-sm"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            verHistoricoCompleto(p.produto);
                          }}
                        >
                          Ver histórico completo do produto →
                        </a>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}