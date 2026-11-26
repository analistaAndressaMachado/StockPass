import { Select } from '../Select/Select';
import './HistoryPagination.css';

export type PageSize = '10' | '20' | '50';

type Props = {
  totalItems: number;
  currentPage: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
};

export function HistoryPagination({ totalItems, currentPage, pageSize, onPageChange, onPageSizeChange }: Props) {
  const perPage = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const lastItem = Math.min(currentPage * perPage, totalItems);

  return (
    <nav className="history-pagination" aria-label="Paginação do histórico">
      <div className="history-pagination__size">
        <span>Registros por página</span>
        <Select<PageSize>
          ariaLabel="Registros por página"
          value={pageSize}
          onChange={onPageSizeChange}
          size="sm"
          options={[
            { value: '10', label: '10' },
            { value: '20', label: '20' },
            { value: '50', label: '50' },
          ]}
        />
      </div>

      <span className="history-pagination__summary" aria-live="polite">
        {totalItems === 0 ? 'Nenhum registro' : `Mostrando ${firstItem}–${lastItem} de ${totalItems} registros`}
      </span>

      <div className="history-pagination__controls">
        <button
          className="btn-secondary"
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          ← Anterior
        </button>
        <span className="history-pagination__page">Página {currentPage} de {totalPages}</span>
        <button
          className="btn-secondary"
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Próxima →
        </button>
      </div>
    </nav>
  );
}
