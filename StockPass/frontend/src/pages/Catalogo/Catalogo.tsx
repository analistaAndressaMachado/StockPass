import { useState } from 'react';
import type { Produto } from '../../types';
import './Catalogo.css';

// Mock provisório, só pra visualizar a tela funcionando.
// Quando o backend de Produto existir, isso vira uma chamada real à API
// (troca useState(PRODUTOS_MOCK) por um useEffect que busca em /api/produtos).
const PRODUTOS_MOCK: Produto[] = [
  { sku: 'SKU-00123', nome: 'Camiseta Básica Algodão Branca', categoria: 'Vestuário', quantidade: 240, preco: 59.9, fornecedor: 'TextilBrasil', pontoReposicao: 100 },
  { sku: 'SKU-00457', nome: 'Calça Jeans Slim Azul', categoria: 'Vestuário', quantidade: 120, preco: 159.9, fornecedor: 'TextilBrasil', pontoReposicao: 80 },
  { sku: 'SKU-00890', nome: 'Tênis Esportivo Conforto', categoria: 'Calçados', quantidade: 65, preco: 249.9, fornecedor: 'StepUp Calçados', pontoReposicao: 50 },
  { sku: 'SKU-00210', nome: 'Mochila Executiva Preta', categoria: 'Acessórios', quantidade: 34, preco: 189.9, fornecedor: 'UrbanBag Co.', pontoReposicao: 40 },
  { sku: 'SKU-01005', nome: 'Fone de Ouvido Bluetooth', categoria: 'Eletrônicos', quantidade: 82, preco: 129.9, fornecedor: 'Digital Gear Ltd', pontoReposicao: 30 },
  { sku: 'SKU-01006', nome: 'Carregador Rápido USB-C 20W', categoria: 'Eletrônicos', quantidade: 310, preco: 89.9, fornecedor: 'Digital Gear Ltd', pontoReposicao: 100 },
  { sku: 'SKU-02011', nome: 'Copo Térmico Inox 500ml', categoria: 'Casa & Cozinha', quantidade: 150, preco: 79.9, fornecedor: 'EcoFlow Supplies', pontoReposicao: 60 },
  { sku: 'SKU-03001', nome: 'Caderno Universitário 200 folhas', categoria: 'Papelaria', quantidade: 420, preco: 22.9, fornecedor: 'PaperMill Co.', pontoReposicao: 150 },
];

type CampoOrdenacao = 'nome' | 'sku' | 'categoria' | 'quantidade' | 'preco';
type DirecaoOrdenacao = 'asc' | 'desc';

function formatarPreco(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_MOCK);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao | null>(null);
  const [direcao, setDirecao] = useState<DirecaoOrdenacao>('desc');
  const [editandoSku, setEditandoSku] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Produto | null>(null);

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

  function salvarEdicao() {
    if (!rascunho) return;
    // Por enquanto só atualiza em memória. Quando o backend de Produto
    // existir, aqui entra uma chamada PUT/PATCH pra API de verdade.
    setProdutos((prev) => prev.map((p) => (p.sku === rascunho.sku ? rascunho : p)));
    setEditandoSku(null);
    setRascunho(null);
  }

  function novoProduto() {
    // Placeholder por enquanto — depois vamos reaproveitar o mesmo Modal
    // de "Adicionar Novo Produto" que já existe no Painel.
    alert('Em breve: formulário de novo produto aqui no Catálogo.');
  }

  return (
    <div className="catalogo">
                     <div className="catalogo-cards">
                       <div className="catalogo-stat-card">
                         <span className="catalogo-stat-label">Estoque total</span>
                         <span className="catalogo-stat-value">{estoqueTotal.toLocaleString('pt-BR')} unid.</span>
                         <span className="catalogo-stat-sub">Soma de todos os produtos</span>
                       </div>
                       <div className="catalogo-stat-card catalogo-stat-card--elevado">
                         <span className="catalogo-stat-label">Alerta de mínimo</span>
                         <span className="catalogo-stat-value">{alertaMinimo} itens</span>
                         <span className="catalogo-stat-sub">Abaixo do estoque de segurança</span>
                       </div>
                       <div className="catalogo-stat-card">
                         <span className="catalogo-stat-label">Valor estimado</span>
                         <span className="catalogo-stat-value">{formatarPreco(valorEstimado)}</span>
                         <span className="catalogo-stat-sub">Baseado no preço de venda</span>
                       </div>
                       <div className="catalogo-stat-card catalogo-stat-card--elevado">
                         <span className="catalogo-stat-label">SKU ativos</span>
                         <span className="catalogo-stat-value">{skuAtivos}</span>
                         <span className="catalogo-stat-sub">Produtos disponíveis</span>
                       </div>
                     </div>

      <div className="catalogo-lista">
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
          <thead>
            <tr>
              <th onClick={() => alternarOrdenacao('nome')}>Nome {setaDoCampo('nome')}</th>
              <th onClick={() => alternarOrdenacao('sku')}>Código {setaDoCampo('sku')}</th>
              <th onClick={() => alternarOrdenacao('categoria')}>Categoria {setaDoCampo('categoria')}</th>
              <th onClick={() => alternarOrdenacao('quantidade')}>Quantidade {setaDoCampo('quantidade')}</th>
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
                      <td>{produto.sku}</td>
                      <td>
                        <input className="edit-input" value={rascunho.categoria}
                          onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value })} />
                      </td>
                      <td>
                        <input className="edit-input edit-input-num" type="number" min={0} value={rascunho.quantidade}
                          onChange={(e) => setRascunho({ ...rascunho, quantidade: Number(e.target.value) })} />
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
                      <td>{formatarPreco(produto.preco)}</td>
                      <td className="acoes-col">
                        <button className="icon-btn" onClick={() => iniciarEdicao(produto)} title="Editar">✏️</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {ordenados.length === 0 && (
          <p className="muted-sm">Nenhum produto encontrado com esses filtros.</p>
        )}
      </div>
    </div>
  );
}