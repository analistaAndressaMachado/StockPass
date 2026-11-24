import { useEffect, useRef, useState } from 'react';
import { listarProdutos, mensagemErro } from '../../services/stockApi';
import type { Produto } from '../../types';
import { Brand } from '../../components/Brand/Brand';
import { TodosItensModal } from './TodosItensModal';
import './Painel.css';

function statusClass(quantidade: number, ponto: number) {
  if (quantidade === 0) return 'badge badge-red';
  if (quantidade < ponto) return 'badge badge-orange';
  return 'badge badge-green';
}

function statusLabel(quantidade: number, ponto: number) {
  if (quantidade === 0) return 'Sem estoque';
  if (quantidade < ponto) return 'Estoque baixo';
  return 'OK';
}

type Props = {
  onRestock: (produto: Produto) => void;
  onNovaEntrada: () => void;
  onNovaSaida: () => void;
  onNovoProduto: () => void;
  onNavigate: (page: string) => void;
};

export function Painel({ onRestock, onNovaEntrada, onNovaSaida, onNovoProduto, onNavigate }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [mostrarTodosItens, setMostrarTodosItens] = useState(false);
  const alertasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    listarProdutos()
      .then(setProdutos)
      .catch((error: unknown) => setErro(mensagemErro(error)));
  }, []);

  const unidades = produtos.reduce((total, produto) => total + produto.quantidade, 0);
  const estoqueBaixo = produtos.filter((produto) => produto.quantidade < produto.pontoReposicao);
  const itensNoMinimoOuAbaixo = produtos.filter((produto) => produto.quantidade <= produto.pontoReposicao);
  const semEstoque = produtos.filter((produto) => produto.quantidade === 0).length;

  return (
    <div className="painel">
      <Brand className="brand-painel" />
      <section className="stats-grid">
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate('catalogo')} aria-label="Ver produtos cadastrados">
          <div className="stat-card-top"><span className="stat-label">Produtos cadastrados</span></div>
          <p className="stat-value">{produtos.length}</p>
          <p className="stat-hint">SKUs no catálogo</p>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate('catalogo')} aria-label="Ver produtos e unidades em estoque">
          <div className="stat-card-top"><span className="stat-label">Unidades em estoque</span></div>
          <p className="stat-value">{unidades.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Saldo atualizado pelas movimentações</p>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => alertasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Ver produtos abaixo do estoque minimo">
          <div className="stat-card-top"><span className="stat-label">Alerta de mínimo</span></div>
          <p className="stat-value">{estoqueBaixo.length}</p>
          <p className="stat-hint">Abaixo do ponto de reposição</p>
        </button>
        <button type="button" className="stat-card stat-card-button" onClick={() => onNavigate('catalogo')} aria-label="Ver produtos sem estoque">
          <div className="stat-card-top"><span className="stat-label">Sem estoque</span></div>
          <p className="stat-value">{semEstoque}</p>
          <p className="stat-hint">Produtos com saldo zerado</p>
        </button>
      </section>

      <section className="panel-card panel-card--soft" ref={alertasRef}>
        <div className="card-header">
          <div>
            <h2>Alertas de estoque mínimo</h2>
            <p className="muted-sm">Produtos abaixo do ponto de reposição</p>
          </div>
          <button className="link-sm" onClick={() => setMostrarTodosItens(true)}>
            Ver todos os itens com baixo estoque
          </button>
        </div>
        {erro && <p className="muted-sm" role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
        <div className="alertas-area">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código do Produto</th>
                <th>Estoque Atual</th>
                <th>Ponto de Reposição</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {estoqueBaixo.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.sku}</td>
                  <td>{produto.quantidade}</td>
                  <td>{produto.pontoReposicao}</td>
                  <td>{produto.fornecedor}</td>
                  <td><span className={statusClass(produto.quantidade, produto.pontoReposicao)}>
                    {statusLabel(produto.quantidade, produto.pontoReposicao)}
                  </span></td>
                  <td>
                    <button className="btn-secondary" onClick={() => onRestock(produto)}>
                      Repor +{produto.pontoReposicao - produto.quantidade}
                    </button>
                  </td>
                </tr>
              ))}
              {estoqueBaixo.length === 0 && (
                <tr><td colSpan={7} className="muted-sm">Nenhum produto abaixo do mínimo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card panel-card--soft-padrao">
        <h2>Ações rápidas</h2>
        <p className="muted-sm">Registre movimentações e gerencie o catálogo</p>
        <div className="quick-actions">
          <button className="btn-primary" onClick={onNovaEntrada}>Nova Entrada de Estoque</button>
          <button className="btn-secondary" onClick={onNovaSaida}>Registrar Saída de Estoque</button>
          <button className="btn-secondary" onClick={onNovoProduto}>Adicionar Novo Produto</button>
        </div>
      </section>
      {mostrarTodosItens && (
        <TodosItensModal produtos={itensNoMinimoOuAbaixo} onClose={() => setMostrarTodosItens(false)} />
      )}
    </div>
  );
}
