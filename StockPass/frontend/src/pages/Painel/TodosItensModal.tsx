import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import type { Produto } from '../../types';
import './TodosItensModal.css';

const ITENS_POR_PAGINA = 8;

type OrdemOpcao = 'nome-asc' | 'nome-desc' | 'categoria-asc' | 'atual-asc' | 'atual-desc';

function statusClass(produto: Produto) {
  if (produto.quantidade === 0) return 'badge badge-red';
  if (produto.quantidade < produto.pontoReposicao) return 'badge badge-orange';
  return 'badge badge-yellow';
}

function statusLabel(produto: Produto) {
  if (produto.quantidade === 0) return 'Sem estoque';
  if (produto.quantidade < produto.pontoReposicao) return 'Estoque baixo';
  return 'No mínimo';
}

type Props = {
  produtos: Produto[];
  onClose: () => void;
};

export function TodosItensModal({ produtos, onClose }: Props) {
  const [ordem, setOrdem] = useState<OrdemOpcao>('nome-asc');
  const [pagina, setPagina] = useState(1);

  const itensOrdenados = [...produtos].sort((a, b) => {
    switch (ordem) {
      case 'nome-asc': return a.nome.localeCompare(b.nome);
      case 'nome-desc': return b.nome.localeCompare(a.nome);
      case 'categoria-asc': return a.categoria.localeCompare(b.categoria);
      case 'atual-asc': return a.quantidade - b.quantidade;
      case 'atual-desc': return b.quantidade - a.quantidade;
      default: return 0;
    }
  });

  const totalPaginas = Math.max(1, Math.ceil(itensOrdenados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensDaPagina = itensOrdenados.slice(inicio, inicio + ITENS_POR_PAGINA);

  return (
    <Modal title="Todos os itens com baixo estoque" onClose={onClose} size="large">
      <div className="todos-itens">
        <div className="todos-itens-toolbar">
          <label className="ordenar-label">
            Ordenar por
            <select
              value={ordem}
              onChange={(e) => {
                setOrdem(e.target.value as OrdemOpcao);
                setPagina(1);
              }}
            >
              <option value="nome-asc">Nome (A–Z)</option>
              <option value="nome-desc">Nome (Z–A)</option>
              <option value="categoria-asc">Categoria (A–Z)</option>
              <option value="atual-asc">Estoque atual (menor primeiro)</option>
              <option value="atual-desc">Estoque atual (maior primeiro)</option>
            </select>
          </label>

          <span className="muted-sm">{itensOrdenados.length} itens no total</span>
        </div>

        <div className="todos-itens-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Ponto de Reposição</th>
                <th>Fornecedor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {itensDaPagina.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.sku}</td>
                  <td>{produto.categoria}</td>
                  <td>{produto.quantidade}</td>
                  <td>{produto.pontoReposicao}</td>
                  <td>{produto.fornecedor}</td>
                  <td><span className={statusClass(produto)}>{statusLabel(produto)}</span></td>
                </tr>
              ))}
              {itensDaPagina.length === 0 && (
                <tr><td colSpan={7} className="muted-sm">Nenhum produto no mínimo ou abaixo.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="todos-itens-footer">
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

          <button className="btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </Modal>
  );
}
