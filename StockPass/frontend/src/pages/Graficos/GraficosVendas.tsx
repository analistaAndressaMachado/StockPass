import { useEffect, useMemo, useState } from 'react';
import { listarSaidas, mensagemErro } from '../../services/stockApi';
import type { Saida } from '../SaidaEstoque/saidasMock';
import './GraficosVendas.css';

type Periodo = 'semana' | 'mes';

function inicioPeriodo(periodo: Periodo) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  if (periodo === 'semana') inicio.setDate(inicio.getDate() - 6);
  else inicio.setDate(1);
  return inicio;
}

export function GraficosVendas() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const dados = await listarSaidas();
        if (ativo) {
          setSaidas(dados);
          setErro('');
        }
      } catch (error) {
        if (ativo) setErro(mensagemErro(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    void carregar();
    const intervalo = window.setInterval(carregar, 15000);
    return () => { ativo = false; window.clearInterval(intervalo); };
  }, []);

  const { vendas, total } = useMemo(() => {
    const inicio = inicioPeriodo(periodo);
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    const porProduto = new Map<string, { sku: string; produto: string; quantidade: number }>();
    saidas.filter((saida) => saida.motivo === 'Venda').filter((saida) => {
      const data = new Date(saida.dataHora);
      return data >= inicio && data <= fim;
    }).forEach((saida) => {
      const atual = porProduto.get(saida.sku) ?? { sku: saida.sku, produto: saida.produto, quantidade: 0 };
      atual.quantidade += saida.quantidade;
      porProduto.set(saida.sku, atual);
    });
    const lista = [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade);
    return { vendas: lista, total: lista.reduce((soma, item) => soma + item.quantidade, 0) };
  }, [saidas, periodo]);

  return (
    <main className="graficos-vendas">
      <section className="panel-card panel-card--soft-padrao vendas-cabecalho">
        <div>
          <h2>Vendas por produto</h2>
          <p className="muted-sm">Quantidade, participacao e unidades vendidas de cada produto.</p>
        </div>
        <label className="vendas-periodo">Periodo
          <select value={periodo} onChange={(event) => setPeriodo(event.target.value as Periodo)}>
            <option value="mes">Este mes</option>
            <option value="semana">Ultimos 7 dias</option>
          </select>
        </label>
      </section>

      {erro && <p role="alert" className="vendas-erro">{erro}</p>}

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Unidades vendidas</span>
          <p className="stat-value">{total.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">No periodo selecionado</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Produtos vendidos</span>
          <p className="stat-value">{vendas.length.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Tipos de produto com venda</p>
        </article>
      </section>

      <section className="panel-card panel-card--soft-padrao vendas-lista">
        <h2>Participacao nas vendas</h2>
        <p className="muted-sm">O percentual e calculado sobre o total de unidades vendidas no periodo.</p>
        {carregando ? <p className="muted-sm">Carregando vendas...</p> : vendas.length === 0 ? (
          <p className="muted-sm">Nenhuma venda registrada neste periodo.</p>
        ) : <div className="vendas-produtos">
          {vendas.map((item) => {
            const percentual = total > 0 ? item.quantidade / total * 100 : 0;
            return <article className="venda-produto" key={item.sku}>
              <div className="venda-produto-info">
                <div><strong>{item.produto}</strong><span>SKU: {item.sku}</span></div>
                <strong>{item.quantidade.toLocaleString('pt-BR')} un. <span className="venda-percentual">{percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span></strong>
              </div>
              <div className="venda-barra-fundo" role="img" aria-label={`${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% das unidades vendidas`}>
                <div className="venda-barra" style={{ width: `${percentual}%` }} />
              </div>
            </article>;
          })}
        </div>}
      </section>
    </main>
  );
}
