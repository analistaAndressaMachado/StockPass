import { useEffect, useMemo, useState } from 'react';
import type { CompraCliente, ProdutoLoja } from '../../services/clientStoreApi';
import { finalizarCompraDemonstrativa, listarComprasCliente, listarProdutosLoja } from '../../services/clientStoreApi';
import { mensagemErro } from '../../services/stockApi';
import './LojaCliente.css';

type PaymentMethod = CompraCliente['metodoPagamento'];

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const nomesPagamento: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
};

export function LojaCliente() {
  const [aba, setAba] = useState<'loja' | 'compras'>('loja');
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [compras, setCompras] = useState<CompraCliente[]>([]);
  const [quantidades, setQuantidades] = useState<Record<number, string>>({});
  const [carrinho, setCarrinho] = useState<Record<number, number>>({});
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>('PIX');
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarDados() {
    try {
      const [catalogo, historico] = await Promise.all([listarProdutosLoja(), listarComprasCliente()]);
      setProdutos(catalogo);
      setCompras(historico);
      setErro('');
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregarDados(); }, []);

  const produtosNoCarrinho = useMemo(() => produtos
    .filter((produto) => (carrinho[produto.id] ?? 0) > 0)
    .map((produto) => ({ ...produto, quantidade: carrinho[produto.id] })), [produtos, carrinho]);
  const total = produtosNoCarrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const totalItens = produtosNoCarrinho.reduce((sum, item) => sum + item.quantidade, 0);

  function adicionarAoCarrinho(produto: ProdutoLoja) {
    const quantidade = Number(quantidades[produto.id] ?? 1);
    const atual = carrinho[produto.id] ?? 0;
    if (!Number.isInteger(quantidade) || quantidade < 1 || atual + quantidade > produto.disponivel) {
      setErro(`A quantidade disponível de ${produto.nome} é ${produto.disponivel}.`);
      return;
    }
    setCarrinho((current) => ({ ...current, [produto.id]: (current[produto.id] ?? 0) + quantidade }));
    setMensagem(`${produto.nome} adicionado ao carrinho.`);
    setErro('');
  }

  function alterarQuantidadeCarrinho(produto: ProdutoLoja, value: string) {
    const quantidade = Number(value);
    if (value === '' || !Number.isInteger(quantidade) || quantidade <= 0) {
      setCarrinho((current) => {
        const next = { ...current };
        delete next[produto.id];
        return next;
      });
      return;
    }
    if (quantidade > produto.disponivel) {
      setErro(`A quantidade disponível de ${produto.nome} é ${produto.disponivel}.`);
      return;
    }
    setErro('');
    setCarrinho((current) => ({ ...current, [produto.id]: quantidade }));
  }

  async function confirmarCompra() {
    if (!produtosNoCarrinho.length) return;
    setProcessando(true);
    setErro('');
    setMensagem('');
    try {
      const compra = await finalizarCompraDemonstrativa(metodoPagamento, produtosNoCarrinho.map((item) => ({
        productId: item.id,
        quantity: item.quantidade,
      })));
      setCarrinho({});
      await carregarDados();
      setAba('compras');
      setMensagem(`Pedido ${compra.numeroPedido} confirmado. Pagamento demonstrativo registrado e saída lançada no estoque.`);
    } catch (error) {
      setErro(mensagemErro(error));
      await carregarDados();
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="loja-cliente">
      <section className="panel-card panel-card--soft-padrao loja-cabecalho">
        <div>
          <h2>Área do Cliente</h2>
          <p className="muted-sm">Produtos disponíveis no estoque para compra.</p>
        </div>
        <div className="loja-resumo-carrinho">
          <span>{totalItens} itens</span>
          <strong>{money(total)}</strong>
        </div>
      </section>

      <nav className="loja-abas" aria-label="Navegação da loja">
        <button type="button" className={aba === 'loja' ? 'ativa' : ''} aria-current={aba === 'loja' ? 'page' : undefined} onClick={() => setAba('loja')}>Loja</button>
        <button type="button" className={aba === 'compras' ? 'ativa' : ''} aria-current={aba === 'compras' ? 'page' : undefined} onClick={() => setAba('compras')}>Minhas compras ({compras.length})</button>
      </nav>

      {aba === 'loja' && <p className="loja-aviso-pagamento">
        Ambiente demonstrativo: nenhuma cobrança real será feita. Ao confirmar, o pedido será registrado como pago na demonstração e a saída será lançada no estoque.
      </p>}
      {erro && <p className="loja-mensagem loja-mensagem-erro" role="alert">{erro}</p>}
      {mensagem && <p className="loja-mensagem loja-mensagem-sucesso" role="status">{mensagem}</p>}

      {aba === 'loja' && <section className="loja-layout">
        <div className="loja-produtos">
          <div className="loja-secao-titulo">
            <div>
              <h2>Produtos disponíveis</h2>
              <p className="muted-sm">O saldo é validado novamente ao confirmar o pedido.</p>
            </div>
          </div>
          {carregando ? <p className="muted-sm">Carregando produtos...</p> : produtos.length === 0 ? (
            <div className="loja-vazio">Não há produtos disponíveis para compra no momento.</div>
          ) : (
            <div className="loja-produto-lista">
              {produtos.map((produto) => (
                <article className="loja-produto" key={produto.id}>
                  <div className="loja-produto-info">
                    <span className="loja-categoria">{produto.categoria}</span>
                    <h3>{produto.nome}</h3>
                    <p className="muted-sm">Código {produto.sku} · {produto.disponivel} un. disponíveis</p>
                  </div>
                  <strong className="loja-preco">{money(produto.preco)}</strong>
                  <div className="loja-adicionar">
                    <label htmlFor={`produto-qtd-${produto.id}`}>Quantidade</label>
                    <input
                      id={`produto-qtd-${produto.id}`}
                      type="number"
                      min={1}
                      max={produto.disponivel}
                      value={quantidades[produto.id] ?? '1'}
                      onChange={(event) => setQuantidades({ ...quantidades, [produto.id]: event.target.value })}
                    />
                    <button className="btn-secondary" onClick={() => adicionarAoCarrinho(produto)}>Adicionar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel-card panel-card--soft-padrao loja-carrinho">
          <h2>Carrinho</h2>
          {produtosNoCarrinho.length === 0 ? (
            <p className="muted-sm">Adicione produtos para continuar.</p>
          ) : (
            <>
              <div className="loja-carrinho-itens">
                {produtosNoCarrinho.map((item) => (
                  <div className="loja-carrinho-item" key={item.id}>
                    <div>
                      <strong>{item.nome}</strong>
                      <span>{money(item.preco)} cada</span>
                    </div>
                    <input
                      aria-label={`Quantidade de ${item.nome}`}
                      type="number"
                      min={1}
                      max={item.disponivel}
                      value={item.quantidade}
                      onChange={(event) => alterarQuantidadeCarrinho(item, event.target.value)}
                    />
                    <strong>{money(item.preco * item.quantidade)}</strong>
                  </div>
                ))}
              </div>
              <label className="loja-metodo-pagamento">
                Forma de pagamento demonstrativa
                <select value={metodoPagamento} onChange={(event) => setMetodoPagamento(event.target.value as PaymentMethod)}>
                  <option value="PIX">PIX (simulado)</option>
                  <option value="CREDIT_CARD">Cartão de crédito (simulado)</option>
                  <option value="DEBIT_CARD">Cartão de débito (simulado)</option>
                </select>
              </label>
              <div className="loja-total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              <button className="btn-primary loja-confirmar" disabled={processando || !produtosNoCarrinho.length} onClick={() => void confirmarCompra()}>
                {processando ? 'Confirmando...' : 'Confirmar compra demonstrativa'}
              </button>
            </>
          )}
        </aside>
      </section>}

      {aba === 'compras' && <section className="panel-card panel-card--soft-padrao loja-historico">
        <div className="loja-secao-titulo">
          <div>
            <h2>Minhas compras</h2>
            <p className="muted-sm">Pedidos demonstrativos confirmados nesta conta.</p>
          </div>
        </div>
        {carregando ? <p className="muted-sm">Carregando compras...</p> : erro && compras.length === 0 ? null : compras.length === 0 ? <p className="muted-sm">Nenhuma compra registrada.</p> : (
          <div className="loja-historico-lista">
            {compras.map((compra) => (
              <article className="loja-pedido" key={compra.id}>
                <div className="loja-pedido-topo">
                  <strong>Pedido {compra.numeroPedido}</strong>
                  <span>{new Date(compra.criadaEm).toLocaleString('pt-BR')}</span>
                </div>
                <ul className="loja-pedido-itens">
                  {compra.itens.map((item) => (
                    <li key={item.productId}>
                      <div><strong>{item.produto}</strong><span>Código {item.sku}</span></div>
                      <span>{item.quantidade} × {money(item.precoUnitario)}</span>
                      <strong>{money(item.subtotal)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="loja-pedido-rodape">
                  <span>Pago (demonstração) · {nomesPagamento[compra.metodoPagamento]}</span>
                  <strong>{money(compra.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>}
    </div>
  );
}
