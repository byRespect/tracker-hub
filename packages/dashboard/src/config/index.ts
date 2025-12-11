/**
 * Application Configuration
 * 
 * Ortam değişkenleri ve uygulama genelinde kullanılan sabit değerler.
 * Production'da environment variable'lardan okunabilir.
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:1337',
  TIMEOUT: 30000,
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  DETAIL_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50],
} as const;

export const UI_CONFIG = {
  CHART_BUCKET_COUNT: 30,
  MAX_ALERTS_DISPLAY: 10,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
} as const;

// Time format ayarları - Türkiye locale'i için
export const TIME_CONFIG = {
  LOCALE: 'tr-TR',
  DATE_OPTIONS: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  } as Intl.DateTimeFormatOptions,
  TIME_OPTIONS: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  } as Intl.DateTimeFormatOptions,
} as const;
