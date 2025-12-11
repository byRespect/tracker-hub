/**
 * Session Store - Oturum state yönetimi
 * 
 * Bu modül sessions listesi, aktif session ve ilgili tüm state'i yönetir.
 * useReducer pattern ile predictable state updates sağlar.
 */

import type { Session, PaginationMeta, SessionDetailParams } from '../types';

// Global stats tipi
export interface GlobalStats {
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

// Store state yapısı
export interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
  };
  globalStats: GlobalStats;
}

// Action tipleri
export type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSIONS'; payload: { items: Session[]; page: number; total: number; totalPages: number } }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: { id: string; data: Partial<Session> } }
  | { type: 'REMOVE_SESSION'; payload: string }
  | { type: 'SET_ACTIVE_SESSION'; payload: string | null }
  | { type: 'SET_SESSION_DETAILS'; payload: { id: string; session: Session } }
  | { type: 'SET_PAGINATION'; payload: Partial<SessionState['pagination']> }
  | { type: 'SET_GLOBAL_STATS'; payload: GlobalStats };

// Başlangıç state'i
export const initialState: SessionState = {
  sessions: [],
  activeSessionId: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 10,
  },
  globalStats: {
    totalSessions: 0,
    totalRequests: 0,
    totalLogs: 0,
    totalErrors: 0,
    trends: {
      requests: { percent: '0%', isUp: true },
      logs: { percent: '0%', isUp: true },
      errors: { percent: '0%', isUp: true },
    },
    weeklyTraffic: [0, 0, 0, 0, 0, 0, 0],
  },
};

/**
 * Session reducer - state güncellemelerini handle eder
 * 
 * Her action tipi için pure function olarak state dönüşümü yapar.
 * Immutability prensiplerine uygun şekilde yeni state objesi döner.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_SESSIONS': {
      // API'den gelen session'ları frontend state ile zenginleştir
      const enrichedSessions = action.payload.items.map(session => ({
        ...session,
        name: session.user?.name 
          ? `${session.user.name}'s Session` 
          : `Session ${session.id.substring(0, 6)}`,
        status: 'completed' as const,
        lastActiveAt: new Date(session.timestamp).getTime(),
        // Detaylar sonra yüklenecek
        consoleLogs: session.consoleLogs || [],
        networkLogs: session.networkLogs || [],
        domEvents: session.domEvents || [],
        rrwebEvents: session.rrwebEvents || [],
      }));

      return {
        ...state,
        sessions: enrichedSessions,
        pagination: {
          ...state.pagination,
          page: action.payload.page,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        },
        loading: false,
        error: null,
      };
    }

    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };

    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        ),
      };

    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        activeSessionId: state.activeSessionId === action.payload ? null : state.activeSessionId,
      };

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.payload };

    case 'SET_SESSION_DETAILS':
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.id ? action.payload.session : s
        ),
        loading: false,
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case 'SET_GLOBAL_STATS':
      return {
        ...state,
        globalStats: action.payload,
      };

    default:
      return state;
  }
}
