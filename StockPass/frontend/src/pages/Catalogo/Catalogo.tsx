import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { atualizarProduto, criarProduto, listarProdutos, mensagemErro } from '../../services/stockApi';
import type { Produto } from '../../types';
import type { NovoProduto } from '../../services/stockApi';
import './Catalogo.css';

type CampoOrdenacao = 'nome' | 'sku' | 'categoria' | 'quantidade' | 'preco';
type DirecaoOrdenacao = 'asc' | 'desc';
type FormNovoProduto = Omit<NovoProduto, 'quantidadeInicial' | 'preco' | 'pontoReposicao'> & {
  quantidadeInicial: string;
  preco: string;
  pontoReposicao: string;
};

const NOVO_PRODUTO_VAZIO: FormNovoProduto = {
  sku: '', nome: '', categoria: '', quantidadeInicial: '',
  preco: '', fornecedor: '', pontoReposicao: '',
};

function formatarPreco(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Props = {
  openNovoProduto?: boolean;
};

export function Catalogo({ openNovoProduto = false }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [showNovoProduto, setShowNovoProduto] = useState(openNovoProduto);
  const [novo, setNovo] = useState<FormNovoProduto>(NOVO_PRODUTO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao | null>(null);
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('desc');
  const [editandoSku, setEditandoSku] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Produto | null>(null);

  useEffect(() => {
    listarProdutos()
      .then(setProdutos)
      .catch((error: unknown) => setErro(mensagemErro(error)))
      .finally(() => setCarregando(false));
  }, []);

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
    return bateBusca && bateCategoria;
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
        quantidadeInicial: Number(novo.quantidadeInicial),
        preco: Number(novo.preco),
        pontoReposicao: Number(novo.pontoReposicao),
      });
      setProdutos((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
      setShowNovoProduto(false);
      setErro('');
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

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
              placeholder="Buscar por nome, código ou categoria"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select
              className="catalogo-select-categoria"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((produto) => {
              const emEdicao = editandoSku === produto.sku;
              return (
                <tr key={produto.sku}>
                  {emEdicao && rascunho ? (
                    <>
                      <td>
                        <input className="edit-input" value={rascunho.nome}
                          onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })} />
                      </td>
                      <td>
                        <input className="edit-input" value={rascunho.sku}
                          onChange={(e) => setRascunho({ ...rascunho, sku: e.target.value.toUpperCase() })} />
                      </td>
                      <td>
                        <input className="edit-input" value={rascunho.categoria}
                          onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value })} />
                      </td>
                      <td>
                        <span title="O saldo é alterado por entradas e saídas registradas">{rascunho.quantidade}</span>
                      </td>
                      <td>
                        <input className="edit-input" value={rascunho.fornecedor}
                          onChange={(e) => setRascunho({ ...rascunho, fornecedor: e.target.value })} />
                      </td>
                      <td>
                        <input className="edit-input edit-input-num" type="number" min={0} step={1} value={rascunho.pontoReposicao}
                          onChange={(e) => setRascunho({ ...rascunho, pontoReposicao: Number(e.target.value) })} />
                      </td>
                      <td>
                        <input className="edit-input edit-input-num" type="number" min={0} step="0.01" value={rascunho.preco}
                          onChange={(e) => setRascunho({ ...rascunho, preco: Number(e.target.value) })} />
                      </td>
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
                            <td className="acoes-col">
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

      {showNovoProduto && (
        <Modal title="Adicionar Novo Produto" onClose={() => setShowNovoProduto(false)}>
          <form className="modal-form" onSubmit={salvarNovoProduto}>
            <label>Nome do produto<input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required /></label>
            <label>Código do produto<input value={novo.sku} onChange={(e) => setNovo({ ...novo, sku: e.target.value.toUpperCase() })} required /></label>
            <label>Categoria<input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} required /></label>
            <label>Fornecedor<input value={novo.fornecedor} onChange={(e) => setNovo({ ...novo, fornecedor: e.target.value })} required /></label>
            <label>Quantidade inicial<input type="number" min={0} step={1} value={novo.quantidadeInicial} onChange={(e) => setNovo({ ...novo, quantidadeInicial: e.target.value })} required /></label>
            <label>Preço unitário<input type="number" min={0} step="0.01" value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value })} required /></label>
            <label>Ponto de reposição<input type="number" min={0} step={1} value={novo.pontoReposicao} onChange={(e) => setNovo({ ...novo, pontoReposicao: e.target.value })} required /></label>
            {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
            <button className="btn-primary" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Adicionar Produto'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}