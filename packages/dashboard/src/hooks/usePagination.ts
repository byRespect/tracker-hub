/**
 * usePagination Hook - Sayfalama state yönetimi
 * 
 * Console, network ve DOM panel'leri için pagination state'i ve
 * handler'ları sağlar. Debounced search desteği içerir.
 */

import { useState, useCallback, useMemo } from 'react';
import { PAGINATION_CONFIG, UI_CONFIG } from '../config';

interface PaginationParams {
  page: number;
  limit: number;
  search: string;
}

interface UsePaginationOptions {
  initialLimit?: number;
  onParamsChange?: (params: PaginationParams) => void;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { 
    initialLimit = PAGINATION_CONFIG.DETAIL_PAGE_SIZE,
    onParamsChange,
  } = options;

  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: initialLimit,
    search: '',
  });

  // Sayfa değiştir
  const setPage = useCallback((page: number) => {
    setParams(prev => {
      const next = { ...prev, page };
      onParamsChange?.(next);
      return next;
    });
  }, [onParamsChange]);

  // Limit değiştir (sayfayı sıfırla)
  const setLimit = useCallback((limit: number) => {
    setParams(prev => {
      const next = { ...prev, limit, page: 1 };
      onParamsChange?.(next);
      return next;
    });
  }, [onParamsChange]);

  // Search değiştir (sayfayı sıfırla)
  const setSearch = useCallback((search: string) => {
    setParams(prev => {
      const next = { ...prev, search, page: 1 };
      onParamsChange?.(next);
      return next;
    });
  }, [onParamsChange]);

  // Tüm parametreleri sıfırla
  const reset = useCallback(() => {
    const initial = { page: 1, limit: initialLimit, search: '' };
    setParams(initial);
    onParamsChange?.(initial);
  }, [initialLimit, onParamsChange]);

  return {
    ...params,
    setPage,
    setLimit,
    setSearch,
    reset,
  };
}
