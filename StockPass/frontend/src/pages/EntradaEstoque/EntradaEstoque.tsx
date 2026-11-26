import { useEffect, useRef, useState } from 'react';
import './EntradaEstoque.css';
import { Select } from '../../components/Select/Select';
import { HistoryPagination, type PageSize } from '../../components/Pagination/HistoryPagination';
import { paginateItems } from '../../components/Pagination/paginateItems';
import type { Produto } from '../../types';
import { ehHoje, formatarDataHora, formatarHora, nomeDoDia } from './entradasMock';
import type { Entrada } from './entradasMock';
import { NovaEntradaModal } from './NovaEntradaModal';
import type { NovaEntradaDados } from './NovaEntradaModal';
import { listarEntradas, listarProdutos, mensagemErro, registrarEntrada as registrarEntradaApi } from '../../services/stockApi';

type Periodo = 'todos' | 'hoje' | '7dias' | 'mes';

function noPeriodo(iso: string, periodo: Periodo) {
  if (periodo === 'todos') return true;
  const data = new Date(iso);
  const agora = new Date();
  if (periodo === 'hoje') return data.toDateString() === agora.toDateString();
  if (periodo === '7dias') return agora.getTime() - data.getTime() <= 7 * 24 * 60 * 60 * 1000;
  return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
}

type Props = {
  openNovaEntrada?: boolean;
  reposicao?: { productId: number; quantity: number; replenishmentId?: number } | null;
  modalOnly?: boolean;
  onModalClose?: () => void;
  onModalSuccess?: (entradaId: number) => void;
  highlightEntradaId?: number | null;
};

export function EntradaEstoque({ openNovaEntrada = false, reposicao = null, modalOnly = false, onModalClose, onModalSuccess, highlightEntradaId = null }: Props) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>('10');
  const [showNova, setShowNova] = useState(openNovaEntrada || Boolean(reposicao));
  const modalCancelada = useRef(false);
  const [linhaDestaqueId, setLinhaDestaqueId] = useState<number | null>(null);


  useEffect(() => {
    Promise.all([listarEntradas(), listarProdutos()])
      .then(([historico, catalogo]) => {
        setEntradas(historico);
        setProdutos(catalogo);
      })
      .catch((error: unknown) => setErro(mensagemErro(error)));
  }, []);

  useEffect(() => {
    if (highlightEntradaId === null || !entradas.some((entrada) => entrada.id === highlightEntradaId)) return;
    setLinhaDestaqueId(highlightEntradaId);
    const timeout = window.setTimeout(() => setLinhaDestaqueId(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [highlightEntradaId, entradas]);

  const termo = busca.trim().toLowerCase();
  const filtradas = entradas.filter(
    (e) =>
      noPeriodo(e.dataHora, periodo) &&
      (termo === '' ||
        [e.produto, e.sku, e.fornecedor, e.registradoPor].some((campo) => campo.toLowerCase().includes(termo))),
  );

  const paginacao = paginateItems(filtradas, pagina, Number(pageSize));
  const { items: visiveis, currentPage: paginaAtual, totalPages: totalPaginas } = paginacao;

  useEffect(() => {
    if (pagina !== paginaAtual) setPagina(paginaAtual);
  }, [pagina, paginaAtual]);

  // Números dos cards do topo
  const entradasHoje = entradas.filter((e) => ehHoje(e.dataHora)).length;
  const unidadesRecebidas = filtradas.reduce((soma, e) => soma + e.quantidade, 0);
  const fornecedores = new Set(filtradas.map((e) => e.fornecedor)).size;
  const ultima = entradas[0];

  async function registrarEntrada(dados: NovaEntradaDados) {
    try {
      const nova = await registrarEntradaApi(dados.productId, dados.quantidade, dados.notaFiscal, dados.replenishmentId);
      setEntradas((prev) => [nova, ...prev]);
      setPagina(1);
      setProdutos((prev) => prev.map((produto) => produto.id === dados.productId
        ? { ...produto, quantidade: produto.quantidade + dados.quantidade }
        : produto));
      setErro('');
      setShowNova(false);
      if (modalOnly && !modalCancelada.current) onModalSuccess?.(nova.id);
    } catch (error) {
      setErro(mensagemErro(error));
      throw error;
    }
  }

  if (modalOnly) {
    return showNova ? (
      <NovaEntradaModal
        products={produtos}
        reposicao={reposicao}
        onClose={() => {
          modalCancelada.current = true;
          setShowNova(false);
          onModalClose?.();
        }}
        onSave={registrarEntrada}
      />
    ) : null;
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

      {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}

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
            <Select<Periodo>
              className="entrada-filtro-periodo"
              value={periodo}
              onChange={(value) => {
                setPeriodo(value);
                setPagina(1);
              }}
              ariaLabel="Filtrar entradas por período"
              size="sm"
              options={[
                { value: 'todos', label: 'Todo o histórico' },
                { value: 'hoje', label: 'Hoje' },
                { value: '7dias', label: 'Últimos 7 dias' },
                { value: 'mes', label: 'Este mês' },
              ]}
            />
          </div>
        </div>

        <div className="entrada-tabela-area">
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
                  <tr key={e.id} className={e.id === linhaDestaqueId ? 'linha-recem-criada' : undefined}>
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
        <HistoryPagination
          totalItems={filtradas.length}
          currentPage={paginaAtual}
          pageSize={pageSize}
          onPageChange={setPagina}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPagina(1);
          }}
        />

      </section>

      {showNova && (
        <NovaEntradaModal
          products={produtos}
          reposicao={reposicao}
          onClose={() => setShowNova(false)}
          onSave={registrarEntrada}
        />
      )}
    </div>
  );
}
