/**
 * Session Types - Oturum ve kullanıcı veri modelleri
 */

import type { ConsoleLog } from './console';
import type { NetworkLog } from './network';
import type { DOMEvent } from './dom';
import type { PaginationMeta } from './common';

// Kullanıcı bilgileri
export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
}

// Ana session veri modeli
export interface Session {
  _id?: string;                    // MongoDB ObjectId
  id: string;                      // Custom session identifier
  timestamp: string;               // ISO 8601 format
  type?: string;                   // Session tipi (manual, auto, etc.)
  duration?: number;               // Milisaniye cinsinden süre
  
  // Log koleksiyonları
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  domEvents: DOMEvent[];
  rrwebEvents: unknown[];          // rrweb replay event'leri
  
  // Metadata
  userAgent?: string;
  url?: string;
  user?: UserInfo;
  __v?: number;                    // MongoDB version key
  
  // Özet alanları (liste API'sinden gelir)
  totalNetworkLogs?: number;
  totalLogs?: number;
  totalErrors?: number;
  
  // Nested resource pagination bilgileri
  consoleLogsPagination?: PaginationMeta;
  networkLogsPagination?: PaginationMeta;
  domEventsPagination?: PaginationMeta;
  
  // Frontend-only state (UI için)
  name?: string;
  status?: 'active' | 'paused' | 'completed';
  lastActiveAt?: number;
}

// Session listesi API response'u
export interface SessionsListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Session[];
}

// Session detay sorgu parametreleri
export interface SessionDetailParams {
  consoleLogsPage?: number;
  consoleLogsLimit?: number;
  consoleLogsSearch?: string;
  networkLogsPage?: number;
  networkLogsLimit?: number;
  networkLogsSearch?: string;
  domEventsPage?: number;
  domEventsLimit?: number;
  domEventsSearch?: string;
}
