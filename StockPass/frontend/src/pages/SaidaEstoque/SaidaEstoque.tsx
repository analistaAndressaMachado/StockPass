import { useEffect, useRef, useState } from 'react';
import './SaidaEstoque.css';
import type { User } from '../../types';
import {
  MOTIVOS_SAIDA,
  SAIDAS_INICIAIS,
  ehHoje,
  formatarDataHora,
  formatarHora,
  motivoClass,
  nomeDoDia,
} from './saidasMock';
import type { Saida } from './saidasMock';
import { NovaSaidaModal } from './NovaSaidaModal';
import type { NovaSaidaDados } from './NovaSaidaModal';

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

export function SaidaEstoque({ user }: Props) {
  const [saidas, setSaidas] = useState<Saida[]>(SAIDAS_INICIAIS);
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [motivoFiltro, setMotivoFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showNova, setShowNova] = useState(false);

  // Quantas linhas cabem na tela agora (mesma ideia do Painel e da Entrada).
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
  const filtradas = saidas.filter(
    (s) =>
      noPeriodo(s.dataHora, periodo) &&
      (motivoFiltro === 'Todos' || s.motivo === motivoFiltro) &&
      (termo === '' || [s.produto, s.sku, s.registradoPor].some((campo) => campo.toLowerCase().includes(termo))),
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / linhasPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * linhasPorPagina;
  const visiveis = filtradas.slice(inicio, inicio + linhasPorPagina);

  // Números dos cards do topo
  const saidasHoje = saidas.filter((s) => ehHoje(s.dataHora)).length;
  const unidadesRetiradas = filtradas.reduce((soma, s) => soma + s.quantidade, 0);
  const ultima = saidas[0];

  // Motivo que mais aparece no período selecionado
  const contagemMotivos: Record<string, number> = {};
  filtradas.forEach((s) => {
    contagemMotivos[s.motivo] = (contagemMotivos[s.motivo] ?? 0) + 1;
  });
  const principal = Object.entries(contagemMotivos).sort((a, b) => b[1] - a[1])[0];

  function registrarSaida(dados: NovaSaidaDados) {
    // Por enquanto só entra na lista em memória (no navegador). Com o backend,
    // aqui vai uma chamada POST /api/saidas e o servidor grava a data/hora
    // e o usuário logado automaticamente (e também desconta do estoque).
    const nova: Saida = {
      id: Date.now(),
      dataHora: new Date().toISOString(),
      sku: dados.sku,
      produto: dados.produto,
      quantidade: dados.quantidade,
      motivo: dados.motivo,
      registradoPor: user.name,
      observacao: dados.observacao,
    };
    setSaidas((prev) => [nova, ...prev]);
    setPagina(1);
    setShowNova(false);
  }

  return (
    <div className="saida">
      <section className="panel-card panel-card--soft-padrao saida-topo">
        <div>
          <h2>Saída de Estoque</h2>
          <p className="muted-sm">Registre e acompanhe tudo o que saiu do estoque</p>
        </div>

        <button className="btn-primary" onClick={() => setShowNova(true)}>
          Registrar Saída de Estoque
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Saídas hoje</span>
          <p className="stat-value">{saidasHoje}</p>
          <p className="stat-hint">Registros feitos hoje</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Unidades retiradas</span>
          <p className="stat-value">{unidadesRetiradas.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Uni no período selecionado</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Principal motivo</span>
          <p className="stat-value">{principal ? principal[0] : '—'}</p>
          <p className="stat-hint">{principal ? `${principal[1]} saídas no período` : 'Nenhuma saída no período'}</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Última saída</span>
          <p className="stat-value">{ultima ? formatarHora(ultima.dataHora) : '—'}</p>
          <p className="stat-hint saida-hint-curto">
            {ultima ? `${nomeDoDia(ultima.dataHora)} · ${ultima.produto}` : 'Nenhuma saída ainda'}
          </p>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao saida-historico">
        <div className="saida-historico-topo">
          <div>
            <h2>Histórico de saídas</h2>
            <p className="muted-sm">Quem registrou, quando, quanto saiu e por qual motivo</p>
          </div>

          <div className="saida-filtros">
            <input
              type="search"
              placeholder="Buscar produto, código, usuário..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
            <select
              value={motivoFiltro}
              onChange={(e) => {
                setMotivoFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="Todos">Todos os motivos</option>
              {MOTIVOS_SAIDA.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
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

        <div className="saida-tabela-area" ref={areaTabelaRef}>
          {filtradas.length === 0 ? (
            <p className="muted-sm saida-vazio">Nenhuma saída encontrada para esse filtro.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Data e hora</th>
                  <th>Produto</th>
                  <th>Código do Produto</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Registrado por</th>
                  <th>Observação</th>
                </tr>
              </thead>

              <tbody>
                {visiveis.map((s) => (
                  <tr key={s.id}>
                    <td>{formatarDataHora(s.dataHora)}</td>
                    <td>{s.produto}</td>
                    <td>{s.sku}</td>
                    <td>{s.quantidade} Uni</td>
                    <td>
                      <span className={motivoClass(s.motivo)}>{s.motivo}</span>
                    </td>
                    <td>{s.registradoPor}</td>
                    <td>{s.observacao || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="saida-rodape">
          <span className="muted-sm">{filtradas.length} saídas</span>

          <div className="saida-paginacao">
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

      {showNova && <NovaSaidaModal onClose={() => setShowNova(false)} onSave={registrarSaida} />}
    </div>
  );
}