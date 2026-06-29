import { useState, useMemo, useCallback, useEffect } from 'react';

export function usePagination(items, perPage = 10, maxPages) {
  const [page, setPage] = useState(1);

  const calculated = Math.max(1, Math.ceil(items.length / perPage));
  const totalPages = maxPages ? Math.min(calculated, maxPages) : calculated;
  const visibleCount = maxPages ? Math.min(items.length, maxPages * perPage) : items.length;
  const visibleItems = maxPages ? items.slice(0, visibleCount) : items;

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return visibleItems.slice(start, start + perPage);
  }, [visibleItems, page, perPage]);

  const goToPage = useCallback(
    (p) => setPage((current) => Math.min(Math.max(1, p), totalPages)),
    [totalPages]
  );

  const reset = useCallback(() => setPage(1), []);

  useEffect(() => {
    setPage(1);
  }, [items]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return { page, totalPages, paginated, goToPage, reset, perPage };
}
