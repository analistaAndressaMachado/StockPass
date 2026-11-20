import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ClienteCadastrado, CompraCliente, EditarClienteInput, NovoClienteInput } from '../../services/clientStoreApi';
import { atualizarClienteCadastrado, criarClienteCadastrado, excluirClienteCadastrado, listarClientesCadastrados, listarComprasDoCliente } from '../../services/clientStoreApi';
import { mensagemErro } from '../../services/stockApi';
import { ClienteModal } from './ClienteModal';
import './ClientesAdmin.css';

const pagamentos: Record<CompraCliente['metodoPagamento'], string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
};

function dinheiro(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? '').join('').toLocaleUpperCase('pt-BR');
}

export function ClientesAdmin() {
  const [clientes, setClientes] = useState<ClienteCadastrado[]>([]);
  const [selecionado, setSelecionado] = useState<ClienteCadastrado | null>(null);
  const [compras, setCompras] = useState<CompraCliente[]>([]);
  const [busca, setBusca] = useState('');
  const [podeCadastrarCliente, setPodeCadastrarCliente] = useState(false);
  const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState(false);
  const [modalEditarClienteAberto, setModalEditarClienteAberto] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [carregandoCompras, setCarregandoCompras] = useState(false);
  const [erroClientes, setErroClientes] = useState('');
  const [erroCompras, setErroCompras] = useState('');

  useEffect(() => {
    let ativo = true;
    listarClientesCadastrados()
      .then((dados) => { if (ativo) { setClientes(dados); setSelecionado(dados[0] ?? null); } })
      .catch((erro: unknown) => { if (ativo) setErroClientes(mensagemErro(erro)); })
      .finally(() => { if (ativo) setCarregandoClientes(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    api.get<{ role: string }>('/auth/profile')
      .then(({ data }) => {
        if (ativo) setPodeCadastrarCliente(data.role === 'GESTOR' || data.role === 'ADMIN');
      })
      .catch(() => { if (ativo) setPodeCadastrarCliente(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!selecionado) { setCompras([]); return; }
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
  const totalCompras = compras.reduce((total, compra) => total + compra.total, 0);
  const ultimaCompra = compras.reduce<CompraCliente | null>((maisRecente, compra) =>
    !maisRecente || new Date(compra.criadaEm) > new Date(maisRecente.criadaEm) ? compra : maisRecente, null);

  async function salvarCliente(input: NovoClienteInput | EditarClienteInput) {
    if (!input.password) throw new Error('Informe a senha inicial do cliente.');
    const criado = await criarClienteCadastrado(input as NovoClienteInput);
    setModalNovoClienteAberto(false);
    setErroClientes('');
    setBusca('');
    try {
      const atualizados = await listarClientesCadastrados();
      setClientes(atualizados);
      setSelecionado(atualizados.find((cliente) => cliente.id === criado.id) ?? criado);
    } catch (erro: unknown) {
      setErroClientes(`Cliente salvo, mas a lista não foi atualizada: ${mensagemErro(erro)}`);
    }
  }

  async function editarCliente(input: NovoClienteInput | EditarClienteInput) {
    if (!selecionado) return;
    const atualizado = await atualizarClienteCadastrado(selecionado.id, input as EditarClienteInput);
    setModalEditarClienteAberto(false);
    try {
      const atualizados = await listarClientesCadastrados();
      setClientes(atualizados);
      setSelecionado(atualizados.find((cliente) => cliente.id === atualizado.id) ?? atualizado);
      setErroClientes('');
    } catch (erro: unknown) {
      setClientes((anteriores) => anteriores.map((cliente) => cliente.id === atualizado.id ? atualizado : cliente));
      setSelecionado(atualizado);
      setErroClientes(`Cliente salvo, mas a lista não foi atualizada: ${mensagemErro(erro)}`);
    }
  }

  async function excluirCliente() {
    if (!selecionado) return;
    await excluirClienteCadastrado(selecionado.id);
    setModalEditarClienteAberto(false);
    try {
      const atualizados = await listarClientesCadastrados();
      setClientes(atualizados);
      setSelecionado(atualizados[0] ?? null);
      setErroClientes('');
    } catch (erro: unknown) {
      setSelecionado(null);
      setErroClientes(`Cliente excluído, mas a lista não foi atualizada: ${mensagemErro(erro)}`);
    }
  }

  return (
    <div className="clientes-admin">
      <header className="clientes-admin-cabecalho">
        <div>
          <h2>Clientes cadastrados</h2>
          <p>Acompanhe os clientes e o histórico de compras em um só lugar.</p>
        </div>
        <div className="clientes-admin-cabecalho-acoes">
          <label className="clientes-admin-busca">
            <input type="search" aria-label="Buscar cliente por nome ou e-mail" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(event) => setBusca(event.target.value)} />
          </label>
          {podeCadastrarCliente && <button className="btn-primary clientes-admin-novo-cliente" type="button"
            onClick={() => setModalNovoClienteAberto(true)}>+ Novo cliente</button>}
        </div>
      </header>

      <div className="clientes-admin-layout">
        <section className="panel-card panel-card--soft-padrao clientes-admin-lista" aria-label="Lista de clientes">
          <div className="clientes-admin-lista-topo"><h3>Clientes</h3><span>{filtrados.length} exibidos</span></div>
          <div className="clientes-admin-lista-itens">
            {carregandoClientes ? <p className="clientes-admin-lista-status">Carregando clientes...</p> : erroClientes ? <p className="clientes-admin-lista-status" role="alert">{erroClientes}</p> : filtrados.length === 0 ? <p className="clientes-admin-lista-vazia">Nenhum cliente encontrado.</p> : (
              filtrados.map((cliente) => (
                <button type="button" className={`clientes-admin-cliente${selecionado?.id === cliente.id ? ' selecionado' : ''}`} key={cliente.id} aria-pressed={selecionado?.id === cliente.id} onClick={() => setSelecionado(cliente)}>
                  <span className="clientes-admin-avatar" aria-hidden="true">{iniciais(cliente.name)}</span>
                  <span className="clientes-admin-cliente-texto"><strong>{cliente.name}</strong><span>{cliente.email}</span></span>
                  <span className={`badge ${cliente.active ? 'badge-green' : 'badge-gray'} clientes-admin-status`}>
                    {cliente.active ? 'Ativo' : 'Inativo'}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="clientes-admin-conteudo" aria-label="Detalhes do cliente">
          {!selecionado ? <div className="clientes-admin-vazio-detalhes"><p>{carregandoClientes ? 'Carregando dados dos clientes...' : 'Selecione um cliente para consultar seus dados e pedidos.'}</p></div> : (
            <>
              <div className="panel-card panel-card--soft-padrao clientes-admin-identidade">
                <div className="clientes-admin-identidade-topo">
                  <span className="clientes-admin-avatar clientes-admin-avatar-grande" aria-hidden="true">{iniciais(selecionado.name)}</span>
                  <div className="clientes-admin-identidade-dados">
                    <h2>{selecionado.name}</h2>
                    <p className="clientes-admin-email">{selecionado.email}</p>
                    {selecionado.phone && <p className="clientes-admin-telefone">{selecionado.phone}</p>}
                    <span className={`badge ${selecionado.active ? 'badge-green' : 'badge-gray'} clientes-admin-status-detalhe`}>
                      {selecionado.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <span className="clientes-admin-cadastro">Cliente desde {new Date(selecionado.createdAt).toLocaleDateString('pt-BR')}</span>
                  {podeCadastrarCliente && <button className="icon-btn clientes-admin-editar" type="button" title="Editar" aria-label={`Editar cliente ${selecionado.name}`} onClick={() => setModalEditarClienteAberto(true)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39 0-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                  </button>}
                </div>
                <div className="clientes-admin-resumo" aria-label="Resumo de compras">
                  <div className="stat-card clientes-admin-resumo-item"><span>Pedidos realizados</span><strong>{carregandoCompras || erroCompras ? '—' : compras.length}</strong></div>
                  <div className="stat-card clientes-admin-resumo-item"><span>Total comprado</span><strong>{carregandoCompras || erroCompras ? '—' : dinheiro(totalCompras)}</strong></div>
                  <div className="stat-card clientes-admin-resumo-item"><span>Último pedido</span><strong>{carregandoCompras || erroCompras ? '—' : ultimaCompra ? new Date(ultimaCompra.criadaEm).toLocaleDateString('pt-BR') : 'Sem pedidos'}</strong></div>
                </div>
              </div>

              <div className="panel-card panel-card--soft-padrao clientes-admin-painel-pedidos">
                <div className="clientes-admin-pedidos-topo">
                  <div><h3>Histórico de compras</h3><p>Itens e pagamentos dos pedidos deste cliente</p></div>
                  {!carregandoCompras && !erroCompras && <span className="clientes-admin-pedidos-contagem">{compras.length} {compras.length === 1 ? 'pedido' : 'pedidos'}</span>}
                </div>
                {carregandoCompras ? <p className="clientes-admin-feedback">Carregando compras...</p> : erroCompras ? <p className="clientes-admin-feedback" role="alert">{erroCompras}</p> : compras.length === 0 ? <p className="clientes-admin-feedback">Nenhuma compra registrada para este cliente.</p> : compras.map((compra) => (
                  <article className="panel-card panel-card--soft-padrao clientes-admin-pedido" key={compra.id}>
                    <div className="clientes-admin-pedido-cabecalho">
                      <div className="clientes-admin-pedido-identificacao"><strong>Pedido {compra.numeroPedido}</strong><span>{compra.itens.length} {compra.itens.length === 1 ? 'item' : 'itens'}</span></div>
                      <span className="clientes-admin-pedido-data">{new Date(compra.criadaEm).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="clientes-admin-pedido-itens">
                      {compra.itens.map((item) => <div className="clientes-admin-pedido-item" key={item.productId}>
                        <div className="clientes-admin-produto"><strong>{item.produto}</strong><span>Código {item.sku}</span></div>
                        <span className="clientes-admin-item-quantidade">{item.quantidade} × {dinheiro(item.precoUnitario)}</span>
                        <strong className="clientes-admin-item-total">{dinheiro(item.subtotal)}</strong>
                      </div>)}
                    </div>
                    <div className="clientes-admin-pedido-rodape"><span className="clientes-admin-pagamento">Pago · {pagamentos[compra.metodoPagamento]}</span><div className="clientes-admin-total"><span>Total do pedido</span><strong>{dinheiro(compra.total)}</strong></div></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      {modalNovoClienteAberto && <ClienteModal onClose={() => setModalNovoClienteAberto(false)} onSave={salvarCliente} />}
      {modalEditarClienteAberto && selecionado && <ClienteModal cliente={selecionado} onClose={() => setModalEditarClienteAberto(false)} onSave={editarCliente} onDelete={excluirCliente} />}
    </div>
  );
}
