import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
import { atualizarProduto, criarProduto, definirProdutoAtivo, listarProdutos, mensagemErro } from '../../services/stockApi';
import { listarCategorias, type Categoria } from '../../services/categoriesApi';
import type { Produto } from '../../types';
import type { NovoProduto } from '../../services/stockApi';
import './Catalogo.css';

type CampoOrdenacao = 'nome' | 'sku' | 'categoria' | 'quantidade' | 'preco';
type DirecaoOrdenacao = 'asc' | 'desc';
type FormNovoProduto = Omit<NovoProduto, 'quantidadeInicial' | 'preco' | 'pontoReposicao' | 'categoryId'> & {
  categoryId: string;
  quantidadeInicial: string;
  preco: string;
  pontoReposicao: string;
};

const NOVO_PRODUTO_VAZIO: FormNovoProduto = {
  sku: '', nome: '', categoria: '', categoryId: '', quantidadeInicial: '',
  preco: '', fornecedor: '', pontoReposicao: '',
};

function formatarPreco(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function exportarCsv(produtos: Produto[]) {
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const linhas = [
    ['Código', 'Produto', 'Categoria', 'Quantidade', 'Fornecedor', 'Ponto de reposição', 'Preço unitário'],
    ...produtos.map((produto) => [produto.sku, produto.nome, produto.categoria, produto.quantidade,
      produto.fornecedor, produto.pontoReposicao, produto.preco]),
  ];
  const csv = '\uFEFF' + linhas.map((linha) => linha.map(escapar).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `stockpass-estoque-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

type Props = {
  openNovoProduto?: boolean;
  modalOnly?: boolean;
  onModalClose?: () => void;
  onModalSuccess?: (produtoId: number) => void;
  highlightProdutoId?: number | null;
};

export function Catalogo({ openNovoProduto = false, modalOnly = false, onModalClose, onModalSuccess, highlightProdutoId = null }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [showNovoProduto, setShowNovoProduto] = useState(openNovoProduto);
  const [novo, setNovo] = useState<FormNovoProduto>(NOVO_PRODUTO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const modalCancelada = useRef(false);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao | null>(null);
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('desc');
  const [editandoSku, setEditandoSku] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Produto | null>(null);
  const [produtoDestaqueId, setProdutoDestaqueId] = useState<number | null>(null);
  const produtoDestaqueCarregado = highlightProdutoId !== null && produtos.some((produto) => produto.id === highlightProdutoId);

  useEffect(() => {
    listarProdutos()
      .then(setProdutos)
      .catch((error: unknown) => setErro(mensagemErro(error)))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    listarCategorias().then(setCategoriasDisponiveis).catch((error: unknown) => setErro(mensagemErro(error)));
  }, []);

  useEffect(() => {
    if (highlightProdutoId === null || !produtoDestaqueCarregado) return;
    setProdutoDestaqueId(highlightProdutoId);
    const timeout = window.setTimeout(() => setProdutoDestaqueId(null), 500);
    return () => window.clearTimeout(timeout);
  }, [highlightProdutoId, produtoDestaqueCarregado]);

  // Lista de categorias únicas, calculada a partir dos produtos que existem.
  const categorias = ['Todas', ...new Set(produtos.map((p) => p.categoria))];

  // --- Cálculo dos 4 cards do topo ---
  const estoqueTotal = produtos.reduce((soma, p) => soma + p.quantidade, 0);
  const alertaMinimo = produtos.filter((p) => p.quantidade < p.pontoReposicao).length;
  const valorEstimado = produtos.reduce((soma, p) => soma + p.quantidade * p.preco, 0);
  const skuAtivos = produtos.length;

  // --- Filtro por busca (nome, código ou categoria) e por categoria selecionada ---
  const filtrados = produtos.filter((p) => {
    const termo = busca.trim().toLowerCase();
    const bateBusca =
      termo === '' ||
      p.nome.toLowerCase().includes(termo) ||
      p.sku.toLowerCase().includes(termo) ||
      p.categoria.toLowerCase().includes(termo);
    const bateCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    const bateStatus = statusFiltro === 'todos' || (statusFiltro === 'ativos' ? p.active : !p.active);
    return bateBusca && bateCategoria && bateStatus;
  });

  // --- Ordenação por coluna ---
  const ordenados = campoOrdenacao === null
    ? filtrados
    : [...filtrados].sort((a, b) => {
        let resultado = 0;
        if (campoOrdenacao === 'quantidade' || campoOrdenacao === 'preco') {
          resultado = a[campoOrdenacao] - b[campoOrdenacao];
        } else {
          resultado = a[campoOrdenacao].localeCompare(b[campoOrdenacao]);
        }
        return direcao === 'asc' ? resultado : -resultado;
      });

 function alternarOrdenacao(campo: CampoOrdenacao) {
   if (campo !== campoOrdenacao) {
     setCampoOrdenacao(campo);
     setDirecao('desc');
   } else if (direcao === 'desc') {
     setDirecao('asc');
   } else {
     setCampoOrdenacao(null);
   }
 }

function setaDoCampo(campo: CampoOrdenacao) {
  if (campo !== campoOrdenacao) {
    return <span className="sort-icon">▼</span>;
  }
  const simbolo = direcao === 'desc' ? '↓' : '↑';
  return <span className="sort-icon">{simbolo}</span>;
}
  function iniciarEdicao(produto: Produto) {
    setEditandoSku(produto.sku);
    setRascunho({ ...produto });
  }

  function cancelarEdicao() {
    setEditandoSku(null);
    setRascunho(null);
  }

  async function salvarEdicao() {
    if (!rascunho) return;
    try {
      const atualizado = await atualizarProduto(rascunho);
      setProdutos((prev) => prev.map((produto) => produto.id === atualizado.id ? atualizado : produto));
      setErro('');
      setEditandoSku(null);
      setRascunho(null);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function alternarStatus(produto: Produto) {
    if (produto.active && !window.confirm(`Desativar ${produto.nome} (${produto.sku})? O saldo e o histórico serão preservados. Produtos com reservas pendentes não podem ser desativados.`)) return;
    try {
      const atualizado = await definirProdutoAtivo(produto.id, !produto.active);
      setProdutos((prev) => prev.map((item) => item.id === atualizado.id ? atualizado : item));
      setErro('');
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  function novoProduto() {
    setNovo({ ...NOVO_PRODUTO_VAZIO });
    setErro('');
    setShowNovoProduto(true);
  }

  async function salvarNovoProduto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    try {
      const criado = await criarProduto({
        ...novo,
        categoryId: Number(novo.categoryId),
        quantidadeInicial: Number(novo.quantidadeInicial),
        preco: Number(novo.preco),
        pontoReposicao: Number(novo.pontoReposicao),
      });
      setProdutos((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
      setShowNovoProduto(false);
      setErro('');
      if (modalOnly && !modalCancelada.current) onModalSuccess?.(criado.id);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  function fecharModalNovoProduto() {
    modalCancelada.current = true;
    setShowNovoProduto(false);
    if (modalOnly) onModalClose?.();
  }

  function renderNovoProdutoModal() {
    return (
      <Modal title="Adicionar Novo Produto" onClose={fecharModalNovoProduto}>
        <form className="modal-form" onSubmit={salvarNovoProduto}>
          <label>Nome do produto<input maxLength={150} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex: Café em pó 500 g" required /></label>
          <label>Código do produto<input maxLength={64} value={novo.sku} onChange={(e) => setNovo({ ...novo, sku: e.target.value.toUpperCase() })} placeholder="Ex: CAF-500" required /></label>
          <label>Categoria<Select value={novo.categoryId} onChange={(categoryId) => setNovo({ ...novo, categoryId, categoria: categoriasDisponiveis.find((item) => String(item.id) === categoryId)?.name ?? '' })} ariaLabel="Categoria do produto" required options={categoriasDisponiveis.filter((item) => item.active).map((item) => ({ value: String(item.id), label: item.name }))} placeholder="Selecione uma categoria" /></label>
          <label>Fornecedor<input maxLength={150} value={novo.fornecedor} onChange={(e) => setNovo({ ...novo, fornecedor: e.target.value })} placeholder="Ex: Distribuidora Central" required /></label>
          <label>Quantidade inicial<input type="number" min={0} max={2147483647} step={1} value={novo.quantidadeInicial} onChange={(e) => setNovo({ ...novo, quantidadeInicial: e.target.value })} placeholder="Ex: 50" required /></label>
          <label>Preço unitário<input type="number" min={0} max={99999999.99} step="0.01" value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value })} placeholder="Ex: 12,90" required /></label>
          <label>Ponto de reposição<input type="number" min={0} max={2147483647} step={1} value={novo.pontoReposicao} onChange={(e) => setNovo({ ...novo, pontoReposicao: e.target.value })} placeholder="Ex: 10" required /></label>
          {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
          <button className="btn-primary" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Adicionar Produto'}</button>
        </form>
      </Modal>
    );
  }

  if (modalOnly) return showNovoProduto ? renderNovoProdutoModal() : null;

  return (
    <div className="catalogo">
                          <div className="catalogo-cards">
                            <div className="catalogo-stat-card">
                              <span className="catalogo-stat-label">Estoque total</span>
                              <span className="catalogo-stat-value">{estoqueTotal.toLocaleString('pt-BR')} unid.</span>
                              <span className="catalogo-stat-sub">Soma de todos os produtos</span>
                            </div>
                            <div className="catalogo-stat-card">
                              <span className="catalogo-stat-label">Alerta de mínimo</span>
                              <span className="catalogo-stat-value">{alertaMinimo} itens</span>
                              <span className="catalogo-stat-sub">Abaixo do estoque de segurança</span>
                            </div>
                            <div className="catalogo-stat-card">
                              <span className="catalogo-stat-label">Valor estimado</span>
                              <span className="catalogo-stat-value">{formatarPreco(valorEstimado)}</span>
                              <span className="catalogo-stat-sub">Baseado no preço de venda</span>
                            </div>
                            <div className="catalogo-stat-card">
                              <span className="catalogo-stat-label">SKU ativos</span>
                              <span className="catalogo-stat-value">{skuAtivos}</span>
                              <span className="catalogo-stat-sub">Produtos disponíveis</span>
                            </div>
                          </div>

      <div className="catalogo-lista">
        {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
        <div className="catalogo-lista-topo">
          <div>
            <h3>Lista de produtos</h3>
            <p className="muted-sm">Busque por nome, código ou categoria para localizar rapidamente.</p>
          </div>

          <div className="catalogo-controles">
            <input
              className="catalogo-busca"
              type="text"
              placeholder="Buscar por nome, código de barras ou categoria"
              aria-label="Buscar por nome, SKU ou código de barras"
              inputMode="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Select
              className="catalogo-select-categoria"
              value={categoriaFiltro}
              onChange={setCategoriaFiltro}
              ariaLabel="Filtrar por categoria"
              size="sm"
              options={categorias.map((cat) => ({ value: cat, label: cat }))}
            />
            <Select
              className="catalogo-select-categoria"
              value={statusFiltro}
              onChange={setStatusFiltro}
              ariaLabel="Filtrar por status do produto"
              size="sm"
              options={[
                { value: 'todos', label: 'Todos os status' },
                { value: 'ativos', label: 'Ativos' },
                { value: 'inativos', label: 'Inativos' },
              ]}
            />
            <button className="btn-secondary" onClick={() => exportarCsv(ordenados)} title="Exportar os produtos filtrados para CSV">Exportar CSV</button>
            <button className="btn-primary" onClick={novoProduto}>Novo produto</button>
          </div>
        </div>

        <div className="catalogo-tabela-wrap">
                <table className="table">
                  <colgroup>
                    <col className="col-nome" />
                    <col className="col-sku" />
                    <col className="col-categoria" />
                    <col className="col-quantidade" />
                    <col className="col-fornecedor" />
                    <col className="col-reposicao" />
                    <col className="col-preco" />
                    <col className="col-status" />
                    <col className="col-acoes" />
                  </colgroup>
                  <thead>
            <tr>
              <th onClick={() => alternarOrdenacao('nome')}>Nome {setaDoCampo('nome')}</th>
              <th onClick={() => alternarOrdenacao('sku')}>Código {setaDoCampo('sku')}</th>
              <th onClick={() => alternarOrdenacao('categoria')}>Categoria {setaDoCampo('categoria')}</th>
              <th onClick={() => alternarOrdenacao('quantidade')}>Quantidade {setaDoCampo('quantidade')}</th>
              <th>Fornecedor</th>
              <th>Ponto de reposição</th>
              <th onClick={() => alternarOrdenacao('preco')}>Preço {setaDoCampo('preco')}</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((produto) => {
              const emEdicao = editandoSku === produto.sku;
              return (
                <tr key={produto.id} className={produto.id === produtoDestaqueId ? 'linha-recem-criada' : undefined}>
                  {emEdicao && rascunho ? (
                    <>
                      <td>
                        <input className="edit-input" maxLength={150} value={rascunho.nome}
                          onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })} />
                      </td>
                      <td>
                        <input className="edit-input" maxLength={64} value={rascunho.sku}
                          onChange={(e) => setRascunho({ ...rascunho, sku: e.target.value.toUpperCase() })} />
                      </td>
                      <td>
                        <Select value={String(rascunho.categoryId)} onChange={(categoryId) => {
                          const selected = categoriasDisponiveis.find((item) => String(item.id) === categoryId);
                          if (selected) setRascunho({ ...rascunho, categoryId: selected.id, categoria: selected.name });
                        }} ariaLabel="Categoria do produto" size="sm" options={categoriasDisponiveis.filter((item) => item.active || item.id === rascunho.categoryId).map((item) => ({ value: String(item.id), label: `${item.name}${item.active ? '' : ' (inativa)'}` }))} />
                      </td>
                      <td>
                        <span title="O saldo é alterado por entradas e saídas registradas">{rascunho.quantidade}</span>
                      </td>
                      <td>
                        <input className="edit-input" maxLength={150} value={rascunho.fornecedor}
                          onChange={(e) => setRascunho({ ...rascunho, fornecedor: e.target.value })} />
                      </td>
                      <td>
                        <input className="edit-input edit-input-num" type="number" min={0} max={2147483647} step={1} value={rascunho.pontoReposicao}
                          onChange={(e) => setRascunho({ ...rascunho, pontoReposicao: Number(e.target.value) })} />
                      </td>
                      <td>
                        <input className="edit-input edit-input-num" type="number" min={0} max={99999999.99} step="0.01" value={rascunho.preco}
                          onChange={(e) => setRascunho({ ...rascunho, preco: Number(e.target.value) })} />
                      </td>
                      <td><span className={`produto-status ${rascunho.active ? 'is-active' : ''}`}>{rascunho.active ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="acoes-col">
                        <button className="icon-btn icon-btn-ok" onClick={salvarEdicao} title="Salvar">✓</button>
                        <button className="icon-btn icon-btn-cancel" onClick={cancelarEdicao} title="Cancelar">✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{produto.nome}</td>
                      <td>{produto.sku}</td>
                      <td>{produto.categoria}</td>
                      <td>{produto.quantidade}</td>
                      <td>{produto.fornecedor}</td>
                      <td>{produto.pontoReposicao}</td>
                      <td>{formatarPreco(produto.preco)}</td>
                      <td><span className={`produto-status ${produto.active ? 'is-active' : ''}`}>{produto.active ? 'Ativo' : 'Inativo'}</span></td>
                            <td className="acoes-col">
                              <button className="btn-secondary produto-status-action" onClick={() => void alternarStatus(produto)} title={produto.active ? 'Desativar produto' : 'Reativar produto'}>
                                {produto.active ? 'Desativar' : 'Reativar'}
                              </button>
                                                                                                                      <button className="icon-btn" onClick={() => iniciarEdicao(produto)} title="Editar">
                                                                                                                        <svg viewBox="0 0 24 24">
                                                                                                                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                                                                                        </svg>
                                                                                                                      </button>
                            </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {carregando ? <p className="muted-sm">Carregando produtos...</p> : ordenados.length === 0 && (
          <p className="muted-sm">Nenhum produto encontrado com esses filtros.</p>
        )}
      </div>

      {showNovoProduto && renderNovoProdutoModal()}
    </div>
  );
}
