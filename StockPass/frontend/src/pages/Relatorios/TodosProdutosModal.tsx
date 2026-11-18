import { useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { Select } from '../../components/Select/Select';
import { ProdutosPeriodoTabela } from './ProdutosPeriodoTabela';
import type { ProdutoRelatorio } from './produtosPeriodo';

const ITENS_POR_PAGINA = 8;

type OrdemOpcao = 'nome-asc' | 'nome-desc' | 'saidas-desc' | 'estoque-asc';

type Props = {
  produtos: ProdutoRelatorio[];
  onClose: () => void;
  onSchedule?: (produto: ProdutoRelatorio) => void;
  onReceive?: (produto: ProdutoRelatorio) => void;
  onViewHistory?: (produto: ProdutoRelatorio) => void;
  schedulingSku?: string | null;
};

export function TodosProdutosModal({ produtos, onClose, onSchedule, onReceive, onViewHistory, schedulingSku }: Props) {
  const [ordem, setOrdem] = useState<OrdemOpcao>('nome-asc');
  const [pagina, setPagina] = useState(1);

  const ordenados = [...produtos].sort((a, b) => {
    switch (ordem) {
      case 'nome-asc': return a.produto.localeCompare(b.produto);
      case 'nome-desc': return b.produto.localeCompare(a.produto);
      case 'saidas-desc': return b.saidasPeriodo - a.saidasPeriodo;
      case 'estoque-asc': return a.estoqueAtual - b.estoqueAtual;
      default: return 0;
    }
  });

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const daPagina = ordenados.slice(inicio, inicio + ITENS_POR_PAGINA);

  return (
    <Modal title="Todos os produtos do período" onClose={onClose} size="large">
      <div className="todos-itens">
        <div className="todos-itens-toolbar">
          <label className="ordenar-label">
            Ordenar por
            <Select<OrdemOpcao>
              ariaLabel="Ordenar produtos por"
              value={ordem}
              onChange={(value) => {
                setOrdem(value);
                setPagina(1);
              }}
              options={[
                { value: 'nome-asc', label: 'Nome (A–Z)' },
                { value: 'nome-desc', label: 'Nome (Z–A)' },
                { value: 'saidas-desc', label: 'Mais saídas no período' },
                { value: 'estoque-asc', label: 'Estoque atual (menor primeiro)' },
              ]}
            />
          </label>

          <span className="muted-sm">{ordenados.length} produtos no total · clique num produto para ver o gráfico</span>
        </div>

        <div className="todos-itens-table-wrap">
          <ProdutosPeriodoTabela produtos={daPagina} onSchedule={onSchedule} onReceive={onReceive} onViewHistory={onViewHistory} schedulingSku={schedulingSku} />
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

          <button className="btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
