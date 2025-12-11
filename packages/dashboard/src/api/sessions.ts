/**
 * Sessions API - Oturum verileri için endpoint tanımları
 * 
 * Backend ile session CRUD işlemlerini yönetir.
 * Pagination, filtering ve detail fetching burada handle edilir.
 */

import { httpClient } from './client';
import type { 
  Session, 
  SessionsListResponse, 
  SessionDetailParams,
  ConsoleLog,
  NetworkLog,
  DOMEvent,
  PaginationMeta 
} from '../types';

// Session listesi response tipi (paginated)
interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Global stats response tipi
export interface GlobalStatsResponse {
  totalSessions: number;
  totalRequests: number;
  totalLogs: number;
  totalErrors: number;
  trends: {
    requests: { percent: string; isUp: boolean };
    logs: { percent: string; isUp: boolean };
    errors: { percent: string; isUp: boolean };
  };
  weeklyTraffic: number[];
}

/**
 * Tüm session'ların global istatistiklerini getirir
 */
export async function getGlobalStats(): Promise<GlobalStatsResponse> {
  return httpClient.get('/sessions/stats');
}

/**
 * Tüm session'ları sayfalanmış şekilde getirir
 */
export async function getSessions(page = 1, limit = 10): Promise<SessionsListResponse> {
  return httpClient.get(`/sessions?page=${page}&limit=${limit}`);
}

/**
 * Tek bir session'ın detaylarını getirir
 */
export async function getSessionById(mongoId: string): Promise<Session> {
  return httpClient.get(`/sessions/${mongoId}`);
}

/**
 * Yeni session oluşturur
 */
export async function createSession(payload: Partial<Session>): Promise<Session> {
  return httpClient.post('/sessions', payload);
}

/**
 * Session'ı günceller (partial update)
 */
export async function updateSession(mongoId: string, data: Partial<Session>): Promise<Session> {
  return httpClient.patch(`/sessions/${mongoId}`, data);
}

/**
 * Session'ı siler
 */
export async function deleteSession(mongoId: string): Promise<void> {
  return httpClient.delete(`/sessions/${mongoId}`);
}

// ============================================
// Session Detail Endpoints (Nested Resources)
// ============================================

/**
 * Session'a ait console log'ları getirir
 */
export async function getConsoleLogs(
  mongoId: string, 
  params: Pick<SessionDetailParams, 'consoleLogsPage' | 'consoleLogsLimit' | 'consoleLogsSearch'>
): Promise<PaginatedResponse<ConsoleLog>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.consoleLogsPage || 1));
  searchParams.set('limit', String(params.consoleLogsLimit || 20));
  
  if (params.consoleLogsSearch) {
    searchParams.set('search', params.consoleLogsSearch);
  }
  
  return httpClient.get(`/sessions/${mongoId}/console-logs?${searchParams}`);
}

/**
 * Session'a ait network log'ları getirir
 */
export async function getNetworkLogs(
  mongoId: string,
  params: Pick<SessionDetailParams, 'networkLogsPage' | 'networkLogsLimit' | 'networkLogsSearch'>
): Promise<PaginatedResponse<NetworkLog>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.networkLogsPage || 1));
  searchParams.set('limit', String(params.networkLogsLimit || 20));
  
  if (params.networkLogsSearch) {
    searchParams.set('search', params.networkLogsSearch);
  }
  
  return httpClient.get(`/sessions/${mongoId}/network-logs?${searchParams}`);
}

/**
 * Tek bir network log'un detaylı conversation history'sini getirir
 */
export async function getNetworkLogDetails(
  mongoId: string,
  networkLogId: string,
  limit = 100
): Promise<PaginatedResponse<NetworkLog>> {
  return httpClient.get(`/sessions/${mongoId}/network-logs/${networkLogId}/details?page=1&limit=${limit}`);
}

/**
 * Session'a ait DOM event'lerini getirir
 */
export async function getDomEvents(
  mongoId: string,
  params: Pick<SessionDetailParams, 'domEventsPage' | 'domEventsLimit' | 'domEventsSearch'>
): Promise<PaginatedResponse<DOMEvent>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.domEventsPage || 1));
  searchParams.set('limit', String(params.domEventsLimit || 20));
  
  if (params.domEventsSearch) {
    searchParams.set('search', params.domEventsSearch);
  }
  
  return httpClient.get(`/sessions/${mongoId}/dom-events?${searchParams}`);
}

/**
 * Session'a ait rrweb replay event'lerini getirir
 */
export async function getRrwebEvents(mongoId: string): Promise<unknown[]> {
  return httpClient.get(`/sessions/${mongoId}/rrweb-events`);
}
