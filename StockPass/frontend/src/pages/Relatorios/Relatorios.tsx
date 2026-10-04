import './Relatorios.css';
import { useState } from 'react';
import { PRODUTOS_RELATORIO, pontosParaLinha } from './produtosPeriodo';
import { ProdutosPeriodoTabela } from './ProdutosPeriodoTabela';
import { TodosProdutosModal } from './TodosProdutosModal';

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

export function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [showTodos, setShowTodos] = useState(false);

  const resumo = RESUMO_POR_PERIODO[periodo];
  const tendenciaGeral = TENDENCIA_POR_PERIODO[periodo];

  return (
    <div className="relatorios">
      <section className="panel-card panel-card--soft-padrao relatorios-filtro">
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

      <section className="panel-card panel-card--soft-padrao">
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

      <section className="panel-card panel-card--soft-padrao">
        <div className="produtos-periodo-header">
          <div>
            <h2>Produtos no período</h2>
            <p className="muted-sm">Clique num produto pra ver o resumo de movimentações dele</p>
          </div>

          <button className="btn-primary" onClick={() => setShowTodos(true)}>
            Ver todos
          </button>
        </div>

        <ProdutosPeriodoTabela produtos={PRODUTOS_RELATORIO.slice(0, 5)} />
      </section>

      {showTodos && <TodosProdutosModal onClose={() => setShowTodos(false)} />}
    </div>
  );
}