import { useEffect, useState } from 'react';
import { listarProdutos, mensagemErro } from '../../services/stockApi';
import type { Produto } from '../../types';
import { Brand } from '../../components/Brand/Brand';
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
  onNavigate: (page: string, abrirModal?: boolean) => void;
  onRestock: (produto: Produto) => void;
};

export function Painel({ onNavigate, onRestock }: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarProdutos()
      .then(setProdutos)
      .catch((error: unknown) => setErro(mensagemErro(error)));
  }, []);

  const unidades = produtos.reduce((total, produto) => total + produto.quantidade, 0);
  const estoqueBaixo = produtos.filter((produto) => produto.quantidade < produto.pontoReposicao);
  const semEstoque = produtos.filter((produto) => produto.quantidade === 0).length;

  return (
    <div className="painel">
      <Brand className="brand-painel" />
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Produtos cadastrados</span></div>
          <p className="stat-value">{produtos.length}</p>
          <p className="stat-hint">SKUs no catálogo</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Unidades em estoque</span></div>
          <p className="stat-value">{unidades.toLocaleString('pt-BR')}</p>
          <p className="stat-hint">Saldo atualizado pelas movimentações</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Alerta de mínimo</span></div>
          <p className="stat-value">{estoqueBaixo.length}</p>
          <p className="stat-hint">Abaixo do ponto de reposição</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Sem estoque</span></div>
          <p className="stat-value">{semEstoque}</p>
          <p className="stat-hint">Produtos com saldo zerado</p>
        </div>
      </section>

      <section className="panel-card panel-card--soft">
        <div className="card-header">
          <div>
            <h2>Alertas de estoque mínimo</h2>
            <p className="muted-sm">Produtos abaixo do ponto de reposição</p>
          </div>
          <button className="btn-secondary" onClick={() => onNavigate('catalogo')}>Abrir catálogo</button>
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
          <button className="btn-primary" onClick={() => onNavigate('entrada', true)}>Nova Entrada de Estoque</button>
          <button className="btn-secondary" onClick={() => onNavigate('saida', true)}>Registrar Saída de Estoque</button>
          <button className="btn-secondary" onClick={() => onNavigate('catalogo', true)}>Adicionar Novo Produto</button>
        </div>
      </section>
    </div>
  );
}