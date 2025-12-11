/**
 * HTTP Client - API istekleri için temel yapı
 * 
 * Bu modül tüm backend iletişimini merkezi bir noktadan yönetir.
 * Retry logic, error handling ve request/response interceptor'lar buradan kontrol edilir.
 */

import { API_CONFIG } from '../config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

/**
 * API hatalarını standart formata dönüştürür
 */
function createApiError(message: string, status?: number, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

/**
 * Temel HTTP request fonksiyonu
 * Tüm API çağrıları bu fonksiyon üzerinden geçer
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw createApiError(
        `API Error: ${response.statusText}`,
        response.status,
        `HTTP_${response.status}`
      );
    }

    // DELETE işlemlerinde body olmayabilir
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    // Network hatası veya CORS problemi
    if (error instanceof TypeError) {
      throw createApiError('Network error - API sunucusuna ulaşılamıyor', 0, 'NETWORK_ERROR');
    }
    throw error;
  }
}

/**
 * GET isteği
 */
export function get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  return request<T>(endpoint, { method: 'GET', signal });
}

/**
 * POST isteği
 */
export function post<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body });
}

/**
 * PATCH isteği
 */
export function patch<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'PATCH', body });
}

/**
 * DELETE isteği
 */
export function del<T = void>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

export const httpClient = {
  get,
  post,
  patch,
  delete: del,
};
