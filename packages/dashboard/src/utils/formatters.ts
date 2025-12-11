/**
 * Format Utils - Tarih, sayı ve metin formatlama
 */

import { TIME_CONFIG } from '../config';

/**
 * Timestamp'i okunabilir tarih formatına çevirir
 */
export function formatDate(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(TIME_CONFIG.LOCALE, TIME_CONFIG.DATE_OPTIONS);
}

/**
 * Timestamp'i okunabilir saat formatına çevirir
 */
export function formatTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(TIME_CONFIG.LOCALE, TIME_CONFIG.TIME_OPTIONS);
}

/**
 * Timestamp'i tam tarih ve saat formatına çevirir
 */
export function formatDateTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString(TIME_CONFIG.LOCALE, {
    ...TIME_CONFIG.DATE_OPTIONS,
    ...TIME_CONFIG.TIME_OPTIONS,
  });
}

/**
 * Süreyi okunabilir formata çevirir (ms -> "1.2s" veya "150ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Byte değerini okunabilir formata çevirir
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Sayıyı kısaltılmış formata çevirir (1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num < 1000) return String(num);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * URL'den path kısmını çıkarır
 */
export function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

/**
 * Metni belirli uzunlukta keser
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}
