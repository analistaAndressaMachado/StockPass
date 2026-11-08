import { useEffect, useState } from 'react';
import type { ClienteCadastrado, CompraCliente } from '../../services/clientStoreApi';
import { listarClientesCadastrados, listarComprasDoCliente } from '../../services/clientStoreApi';
import { mensagemErro } from '../../services/stockApi';
import './ClientesAdmin.css';

const pagamentos: Record<CompraCliente['metodoPagamento'], string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
};

function dinheiro(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ClientesAdmin() {
  const [clientes, setClientes] = useState<ClienteCadastrado[]>([]);
  const [selecionado, setSelecionado] = useState<ClienteCadastrado | null>(null);
  const [compras, setCompras] = useState<CompraCliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [carregandoCompras, setCarregandoCompras] = useState(false);
  const [erroClientes, setErroClientes] = useState('');
  const [erroCompras, setErroCompras] = useState('');

  useEffect(() => {
    let ativo = true;
    listarClientesCadastrados()
      .then((dados) => { if (ativo) setClientes(dados); })
      .catch((erro: unknown) => { if (ativo) setErroClientes(mensagemErro(erro)); })
      .finally(() => { if (ativo) setCarregandoClientes(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!selecionado) return;
    let ativo = true;
    setCompras([]);
    setErroCompras('');
    setCarregandoCompras(true);
    listarComprasDoCliente(selecionado.id)
      .then((dados) => { if (ativo) setCompras(dados); })
      .catch((erro: unknown) => { if (ativo) setErroCompras(mensagemErro(erro)); })
      .finally(() => { if (ativo) setCarregandoCompras(false); });
    return () => { ativo = false; };
  }, [selecionado]);

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const filtrados = clientes.filter((cliente) =>
    `${cliente.name} ${cliente.email}`.toLocaleLowerCase('pt-BR').includes(termo));

  return (
    <div className="clientes-admin">
      <header className="clientes-admin-topo">
        <div><h2>Clientes cadastrados</h2><p>{clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}</p></div>
        <input type="search" aria-label="Buscar cliente por nome ou e-mail" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(event) => setBusca(event.target.value)} />
      </header>
      <div className="clientes-admin-layout">
        <section className="clientes-admin-lista" aria-label="Lista de clientes">
          {carregandoClientes ? <p>Carregando clientes...</p> : erroClientes ? <p role="alert">{erroClientes}</p> : filtrados.length === 0 ? <p>Nenhum cliente encontrado.</p> : (
            filtrados.map((cliente) => (
              <button type="button" className={`clientes-admin-cliente${selecionado?.id === cliente.id ? ' selecionado' : ''}`} key={cliente.id} aria-pressed={selecionado?.id === cliente.id} onClick={() => setSelecionado(cliente)}>
                <strong>{cliente.name}</strong><span>{cliente.email}</span>
              </button>
            ))
          )}
        </section>
        <section className="clientes-admin-detalhes" aria-label="Compras do cliente">
          {!selecionado ? <p>Selecione um cliente para ver as compras.</p> : (
            <>
              <div className="clientes-admin-identidade"><h2>{selecionado.name}</h2><p>{selecionado.email}</p><span>Cadastro em {new Date(selecionado.createdAt).toLocaleDateString('pt-BR')}</span></div>
              <div className="clientes-admin-titulo"><h3>Histórico de compras</h3>{!carregandoCompras && !erroCompras && <span>{compras.length} {compras.length === 1 ? 'pedido' : 'pedidos'}</span>}</div>
              {carregandoCompras ? <p>Carregando compras...</p> : erroCompras ? <p role="alert">{erroCompras}</p> : compras.length === 0 ? <p>Nenhuma compra registrada para este cliente.</p> : compras.map((compra) => (
                <article className="clientes-admin-pedido" key={compra.id}>
                  <div className="clientes-admin-pedido-cabecalho"><strong>Pedido {compra.numeroPedido}</strong><span>{new Date(compra.criadaEm).toLocaleString('pt-BR')}</span></div>
                  <ul>{compra.itens.map((item) => <li key={item.productId}><div><strong>{item.produto}</strong><span>Código {item.sku}</span></div><span>{item.quantidade} × {dinheiro(item.precoUnitario)}</span><strong>{dinheiro(item.subtotal)}</strong></li>)}</ul>
                  <div className="clientes-admin-pedido-rodape"><span>Pago (demonstração) · {pagamentos[compra.metodoPagamento]}</span><strong>{dinheiro(compra.total)}</strong></div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}