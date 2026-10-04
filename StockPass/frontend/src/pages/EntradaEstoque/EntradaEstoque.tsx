import { useEffect, useRef, useState } from 'react';
import './EntradaEstoque.css';
import type { User } from '../../types';
import { ENTRADAS_INICIAIS, ehHoje, formatarDataHora, formatarHora, nomeDoDia } from './entradasMock';
import type { Entrada } from './entradasMock';
import { NovaEntradaModal } from './NovaEntradaModal';
import type { NovaEntradaDados } from './NovaEntradaModal';

type Periodo = 'todos' | 'hoje' | '7dias' | 'mes';

const MINIMO_LINHAS = 5;

function noPeriodo(iso: string, periodo: Periodo) {
  if (periodo === 'todos') return true;
  const data = new Date(iso);
  const agora = new Date();
  if (periodo === 'hoje') return data.toDateString() === agora.toDateString();
  if (periodo === '7dias') return agora.getTime() - data.getTime() <= 7 * 24 * 60 * 60 * 1000;
  return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
}

type Props = {
  user: User;
};

export function EntradaEstoque({ user }: Props) {
  const [entradas, setEntradas] = useState<Entrada[]>(ENTRADAS_INICIAIS);
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showNova, setShowNova] = useState(false);

  // Quantas linhas cabem na tela agora (mesma ideia do Painel).
  const [linhasPorPagina, setLinhasPorPagina] = useState(MINIMO_LINHAS);
  const areaTabelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaTabelaRef.current;
    if (!area) return;

    const calcular = () => {
      const cabecalho = area.querySelector('thead');
      const linha = area.querySelector('tbody tr');
      if (!cabecalho || !linha) return;
      const alturaCabecalho = cabecalho.getBoundingClientRect().height;
      const alturaLinha = linha.getBoundingClientRect().height;
      const cabem = Math.floor((area.clientHeight - alturaCabecalho) / alturaLinha);
      setLinhasPorPagina(Math.max(MINIMO_LINHAS, cabem));
    };

    calcular();
    const observer = new ResizeObserver(calcular);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  const termo = busca.trim().toLowerCase();
  const filtradas = entradas.filter(
    (e) =>
      noPeriodo(e.dataHora, periodo) &&
      (termo === '' ||
        [e.produto, e.sku, e.fornecedor, e.registradoPor].some((campo) => campo.toLowerCase().includes(termo))),
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / linhasPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * linhasPorPagina;
  const visiveis = filtradas.slice(inicio, inicio + linhasPorPagina);

  // Números dos cards do topo
  const entradasHoje = entradas.filter((e) => ehHoje(e.dataHora)).length;
  const unidadesRecebidas = filtradas.reduce((soma, e) => soma + e.quantidade, 0);
  const fornecedores = new Set(filtradas.map((e) => e.fornecedor)).size;
  const ultima = entradas[0];

  function registrarEntrada(dados: NovaEntradaDados) {
    // Por enquanto só entra na lista em memória (no navegador). Com o backend,
    // aqui vai uma chamada POST /api/entradas e o servidor grava a data/hora
    // e o usuário logado automaticamente.
    const nova: Entrada = {
      id: Date.now(),
      dataHora: new Date().toISOString(),
      sku: dados.sku,
      produto: dados.produto,
      fornecedor: dados.fornecedor,
      quantidade: dados.quantidade,
      registradoPor: user.name,
      notaFiscal: dados.notaFiscal,
    };
    setEntradas((prev) => [nova, ...prev]);
    setPagina(1);
    setShowNova(false);
  }

  return (
    <div className="entrada">
      <section className="panel-card panel-card--soft-padrao entrada-topo">
        <div>
          <h2>Entrada de Estoque</h2>
          <p className="muted-sm">Registre e acompanhe tudo o que chegou ao estoque</p>
        </div>

        <button className="btn-primary" onClick={() => setShowNova(true)}>
          Nova Entrada de Estoque
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Entradas hoje</span>
          <p className="stat-value">{entradasHoje}</p>
          <p className="stat-hint">Registros feitos hoje</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Unidades recebidas</span>
          <p className="stat-value">{unidadesRecebidas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Uni no período selecionado</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Fornecedores</span>
          <p className="stat-value">{fornecedores}</p>
          <p className="stat-hint">Com entrada no período</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Última entrada</span>
          <p className="stat-value">{ultima ? formatarHora(ultima.dataHora) : '—'}</p>
          <p className="stat-hint entrada-hint-curto">
            {ultima ? `${nomeDoDia(ultima.dataHora)} · ${ultima.produto}` : 'Nenhuma entrada ainda'}
          </p>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao entrada-historico">
        <div className="entrada-historico-topo">
          <div>
            <h2>Histórico de entradas</h2>
            <p className="muted-sm">Quem registrou, quando e quanto entrou de cada produto</p>
          </div>

          <div className="entrada-filtros">
            <input
              type="search"
              placeholder="Buscar produto, código, fornecedor..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
            <select
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value as Periodo);
                setPagina(1);
              }}
            >
              <option value="todos">Todo o histórico</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
            </select>
          </div>
        </div>

        <div className="entrada-tabela-area" ref={areaTabelaRef}>
          {filtradas.length === 0 ? (
            <p className="muted-sm entrada-vazio">Nenhuma entrada encontrada para esse filtro.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Produto</th>
                  <th>Código do Produto</th>
                  <th>Quantidade</th>
                  <th>Fornecedor</th>
                  <th>Registrado por</th>
                  <th>Nota fiscal</th>
                </tr>
              </thead>

              <tbody>
                {visiveis.map((e) => (
                  <tr key={e.id}>
                    <td>{formatarDataHora(e.dataHora)}</td>
                    <td>{e.produto}</td>
                    <td>{e.sku}</td>
                    <td>{e.quantidade} Uni</td>
                    <td>{e.fornecedor}</td>
                    <td>{e.registradoPor}</td>
                    <td>{e.notaFiscal || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="entrada-rodape">
          <span className="muted-sm">{filtradas.length} entradas</span>

          <div className="entrada-paginacao">
            <button
              className="btn-secondary"
              disabled={paginaAtual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </button>

            <span className="muted-sm">Página {paginaAtual} de {totalPaginas}</span>

            <button
              className="btn-secondary"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima →
            </button>
          </div>
        </div>
      </section>

      {showNova && <NovaEntradaModal onClose={() => setShowNova(false)} onSave={registrarEntrada} />}
    </div>
  );
}