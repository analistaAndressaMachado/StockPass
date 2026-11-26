export type PaginatedItems<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
};

export function paginateItems<T>(items: readonly T[], requestedPage: number, requestedPageSize: number): PaginatedItems<T> {
  const pageSize = Number.isFinite(requestedPageSize) && requestedPageSize > 0
    ? Math.max(1, Math.floor(requestedPageSize))
    : 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const normalizedPage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1;
  const currentPage = Math.min(Math.max(1, normalizedPage), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);

  return {
    items: items.slice(startIndex, endIndex),
    currentPage,
    totalPages,
    startIndex,
    endIndex,
  };
}
