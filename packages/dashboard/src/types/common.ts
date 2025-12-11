/**
 * Common Types - Paylaşılan tip tanımları
 */

// Sayfalama metadata'sı
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search?: string | null;
}

// Uygulama görünüm modları
export type ViewMode = 'overview' | 'console' | 'network' | 'session';
