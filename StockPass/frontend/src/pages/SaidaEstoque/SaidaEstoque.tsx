import { useCallback, useEffect, useRef, useState } from 'react';
import './SaidaEstoque.css';
import { Select } from '../../components/Select/Select';
import type { Produto } from '../../types';
import {
  MOTIVOS_SAIDA,
  ehHoje,
  formatarDataHora,
  formatarHora,
  motivoClass,
  nomeDoDia,
} from './saidasMock';
import type { Saida } from './saidasMock';
import type { ReservaSaida } from '../../types';
import { NovaSaidaModal } from './NovaSaidaModal';
import type { NovaSaidaDados } from './NovaSaidaModal';
import {
  cancelarReservaSaida,
  confirmarReservaSaida,
  criarReservaSaida,
  listarProdutos,
  listarReservasSaida,
  listarSaidas,
  mensagemErro,
} from '../../services/stockApi';

type Periodo = 'todos' | 'hoje' | '7dias' | 'mes';

const MINIMO_LINHAS = 5;

function segundosRestantes(expiresAt: string, agora: number) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - agora) / 1000));
}

function formatarContagem(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const restantes = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(restantes).padStart(2, '0')}`;
}

function noPeriodo(iso: string, periodo: Periodo) {
  if (periodo === 'todos') return true;
  const data = new Date(iso);
  const agora = new Date();
  if (periodo === 'hoje') return data.toDateString() === agora.toDateString();
  if (periodo === '7dias') return agora.getTime() - data.getTime() <= 7 * 24 * 60 * 60 * 1000;
  return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
}

type Props = {
  openNovaSaida?: boolean;
  modalOnly?: boolean;
  onModalClose?: () => void;
  onModalSuccess?: (reservaId: number) => void;
  onReservaCriada?: (reservaId: number) => void;
  reservasEmConfirmacaoIds?: number[];
  highlightSaidaId?: number | null;
};

export function SaidaEstoque({ openNovaSaida = false, modalOnly = false, onModalClose, onModalSuccess, onReservaCriada, reservasEmConfirmacaoIds = [], highlightSaidaId = null }: Props) {
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [reservas, setReservas] = useState<ReservaSaida[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [agora, setAgora] = useState(Date.now());
  const [reservaEmAcao, setReservaEmAcao] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [motivoFiltro, setMotivoFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showNova, setShowNova] = useState(openNovaSaida);

  // Quantas linhas cabem na tela agora (mesma ideia do Painel e da Entrada).
  const [linhasPorPagina, setLinhasPorPagina] = useState(MINIMO_LINHAS);
  const areaTabelaRef = useRef<HTMLDivElement>(null);
  const expiracoesAvisadas = useRef(new Set<number>());
  const modalCancelada = useRef(false);
  const [saidaDestaqueId, setSaidaDestaqueId] = useState<number | null>(null);
  const atualizarDados = useCallback(async () => {
    try {
      const [historico, catalogo, reservasAtivas] = await Promise.all([
        listarSaidas(), listarProdutos(), listarReservasSaida(),
      ]);
      setSaidas(historico);
      setProdutos(catalogo);
      setReservas(reservasAtivas);
      setErro('');
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }, []);

  useEffect(() => {
    void atualizarDados();
    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
      void atualizarDados();
    }, 1000);
    return () => window.clearInterval(intervalo);
  }, [atualizarDados]);

  useEffect(() => {
    if (saidaDestaqueId === null) return;
    const timeout = window.setTimeout(() => setSaidaDestaqueId(null), 3300);
    return () => window.clearTimeout(timeout);
  }, [saidaDestaqueId]);

  useEffect(() => {
    if (highlightSaidaId === null || !saidas.some((saida) => saida.id === highlightSaidaId)) return;
    setPagina(1);
    setSaidaDestaqueId(highlightSaidaId);
  }, [highlightSaidaId, saidas]);

  useEffect(() => {
    const expiradas = reservas.filter((reserva) =>
      segundosRestantes(reserva.expiresAt, agora) === 0 && !expiracoesAvisadas.current.has(reserva.id));
    if (expiradas.length === 0) return;
    expiradas.forEach((reserva) => expiracoesAvisadas.current.add(reserva.id));
    setAviso(expiradas.length === 1
      ? `A reserva de ${expiradas[0].product} expirou. O saldo disponível foi liberado pelo backend.`
      : `${expiradas.length} reservas expiraram. Os saldos disponíveis foram liberados pelo backend.`);
  }, [agora, reservas]);

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

  async function registrarSaida(dados: NovaSaidaDados) {
    const reserva = await criarReservaSaida(dados.productId, dados.quantidade, dados.motivo, dados.observacao);
    setReservas((anteriores) => [reserva, ...anteriores.filter((item) => item.id !== reserva.id)]);
    setProdutos((anteriores) => anteriores.map((produto) => produto.id === dados.productId
      ? {
          ...produto,
          reservedQuantity: reserva.status === 'ACTIVE' ? produto.reservedQuantity + reserva.quantity : produto.reservedQuantity,
          availableQuantity: reserva.status === 'ACTIVE' ? produto.availableQuantity - reserva.quantity : produto.availableQuantity,
        }
      : produto));
    expiracoesAvisadas.current.delete(reserva.id);
    setAviso('');
    setErro('');
    setShowNova(false);
    if (modalOnly && !modalCancelada.current) onModalSuccess?.(reserva.id);
    else onReservaCriada?.(reserva.id);
    void atualizarDados();
  }

  if (modalOnly) {
    return showNova ? (
      <NovaSaidaModal
        products={produtos}
        onClose={() => {
          modalCancelada.current = true;
          setShowNova(false);
          onModalClose?.();
        }}
        onSave={registrarSaida}
      />
    ) : null;
  }

  async function confirmarReserva(reserva: ReservaSaida) {
    setReservaEmAcao(reserva.id);
    try {
      const nova = await confirmarReservaSaida(reserva.id);
      setSaidas((prev) => [nova, ...prev.filter((item) => item.id !== nova.id)]);
      setSaidaDestaqueId(nova.id);
      setReservas((prev) => prev.filter((item) => item.id !== reserva.id));
      setPagina(1);
      setErro('');
      setAviso(`Saída de ${reserva.quantity} unidade(s) de ${reserva.product} confirmada.`);
      await atualizarDados();
    } catch (error) {
      const detalhe = mensagemErro(error);
      await atualizarDados();
      setErro(`Não foi possível confirmar a reserva. Ela pode ter expirado ou o backend recusou a operação. ${detalhe}`);
    } finally {
      setReservaEmAcao(null);
    }
  }

  async function cancelarReserva(reserva: ReservaSaida) {
    setReservaEmAcao(reserva.id);
    try {
      await cancelarReservaSaida(reserva.id);
      setReservas((prev) => prev.filter((item) => item.id !== reserva.id));
      setAviso(`Reserva de ${reserva.product} cancelada. O saldo disponível foi liberado.`);
      setErro('');
      await atualizarDados();
    } catch (error) {
      const detalhe = mensagemErro(error);
      await atualizarDados();
      setErro(`Não foi possível cancelar a reserva. ${detalhe}`);
    } finally {
      setReservaEmAcao(null);
    }
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

      {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
      {aviso && <p className="muted-sm" role="status">{aviso}</p>}

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

      <section className="panel-card panel-card--soft-padrao">
        <div className="saida-historico-topo">
          <div>
            <h2>Reservas de saída pendentes</h2>
            <p className="muted-sm">Reservas aguardando confirmação ou cancelamento.</p>
          </div>
          <span className="muted-sm">{reservas.filter((r) => !reservasEmConfirmacaoIds.includes(r.id)).length} reservas ativas</span>
        </div>

        {reservas.filter((r) => !reservasEmConfirmacaoIds.includes(r.id)).length === 0 ? (
          <p className="muted-sm">Não há reservas de saída pendentes.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {reservas.filter((r) => !reservasEmConfirmacaoIds.includes(r.id)).map((reserva) => {
              const restante = segundosRestantes(reserva.expiresAt, agora);
              const expirou = restante === 0;
              const processando = reservaEmAcao === reserva.id;
              return (
                <article key={reserva.id} className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{reserva.product}</strong> <span className="muted-sm">({reserva.sku})</span>
                    <p className="muted-sm">{reserva.quantity} Uni · {reserva.reason} · Criada por {reserva.createdBy}</p>
                    <p className="muted-sm">Criada em {formatarDataHora(reserva.createdAt)}{reserva.observation ? ` · ${reserva.observation}` : ''}</p>
                    <strong role={expirou ? 'status' : undefined} style={{ color: expirou ? '#b91c1c' : undefined }}>
                      {expirou ? 'Reserva expirada' : `Tempo para confirmar: ${formatarContagem(restante)}`}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" type="button" disabled={processando || expirou}
                      onClick={() => void confirmarReserva(reserva)}>
                      {processando ? 'Aguarde...' : 'Confirmar'}
                    </button>
                    <button className="btn-secondary" type="button" disabled={processando || expirou}
                      onClick={() => void cancelarReserva(reserva)}>
                      Cancelar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
            <Select
              className="saida-filtro-motivo"
              value={motivoFiltro}
              onChange={(value) => {
                setMotivoFiltro(value);
                setPagina(1);
              }}
              ariaLabel="Filtrar saídas por motivo"
              size="sm"
              options={[
                { value: 'Todos', label: 'Todos os motivos' },
                ...MOTIVOS_SAIDA.map((motivo) => ({ value: motivo, label: motivo })),
              ]}
            />
            <Select<Periodo>
              className="saida-filtro-periodo"
              value={periodo}
              onChange={(value) => {
                setPeriodo(value);
                setPagina(1);
              }}
              ariaLabel="Filtrar saídas por período"
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
                  <tr key={s.id} className={s.id === saidaDestaqueId ? 'linha-recem-criada' : undefined}>
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

      {showNova && <NovaSaidaModal products={produtos} onClose={() => setShowNova(false)} onSave={registrarSaida} />}

    </div>
  );
}
