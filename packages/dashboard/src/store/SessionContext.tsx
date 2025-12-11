/**
 * Session Context - React Context ile global session state
 * 
 * Uygulama genelinde session verilerine erişim sağlar.
 * Provider pattern ile component tree'ye state inject eder.
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import { sessionReducer, initialState, type SessionState, type SessionAction } from './sessionStore';
import { sessionsApi } from '../api';
import type { Session, SessionDetailParams } from '../types';

// Context value tipi
interface SessionContextValue {
  state: SessionState;
  
  // Session CRUD işlemleri
  fetchSessions: (page?: number, limit?: number) => Promise<void>;
  fetchGlobalStats: () => Promise<void>;
  createSession: (name: string) => Promise<void>;
  deleteSession: (customId: string) => Promise<void>;
  updateSession: (customId: string, data: Partial<Session>) => Promise<void>;
  
  // Session navigation
  switchSession: (customId: string, params?: SessionDetailParams) => Promise<void>;
  exitSession: () => void;
  
  // Detay fetch işlemleri
  fetchRrwebEvents: (customId: string) => Promise<unknown[]>;
  fetchNetworkDetails: (mongoId: string, networkLogId: string) => Promise<unknown[]>;
  
  // Convenience getters
  currentSession: Session | undefined;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider - Session state'ini sağlayan wrapper component
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  /**
   * Global istatistikleri API'den getirir
   */
  const fetchGlobalStats = useCallback(async () => {
    try {
      const stats = await sessionsApi.getGlobalStats();
      dispatch({ type: 'SET_GLOBAL_STATS', payload: stats });
    } catch (error) {
      console.error('Global stats fetch hatası:', error);
    }
  }, []);

  /**
   * Session listesini API'den getirir
   */
  const fetchSessions = useCallback(async (page = 1, limit = 10) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Session listesi ve global stats'ı paralel çek
      const [data, stats] = await Promise.all([
        sessionsApi.getSessions(page, limit),
        sessionsApi.getGlobalStats(),
      ]);
      
      // API'den gelen total ve totalPages değerlerini kullan
      const total = data.total ?? data.items.length;
      const totalPages = data.totalPages ?? Math.ceil(total / limit);
      
      dispatch({
        type: 'SET_SESSIONS',
        payload: {
          items: data.items,
          page: data.page,
          total,
          totalPages,
        },
      });
      
      dispatch({ type: 'SET_GLOBAL_STATS', payload: stats });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'API bağlantısı kurulamadı' });
    }
  }, []);

  /**
   * Yeni session oluşturur
   */
  const createSession = useCallback(async (name: string) => {
    const newSessionId = Math.random().toString(36).substring(2, 11);
    
    const payload: Partial<Session> = {
      id: newSessionId,
      timestamp: new Date().toISOString(),
      type: 'manual',
      duration: 0,
      consoleLogs: [],
      networkLogs: [],
      domEvents: [],
      rrwebEvents: [],
      userAgent: navigator.userAgent,
      url: window.location.href,
      user: {
        id: `user-${Math.floor(Math.random() * 1000)}`,
        email: 'dev@example.com',
        name,
      },
    };

    try {
      const savedSession = await sessionsApi.createSession(payload);
      
      const sessionWithState: Session = {
        ...savedSession,
        name,
        status: 'active',
        lastActiveAt: Date.now(),
        consoleLogs: [],
        networkLogs: [],
        domEvents: [],
        rrwebEvents: [],
      };

      dispatch({ type: 'ADD_SESSION', payload: sessionWithState });
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: savedSession.id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Session oluşturulamadı' });
    }
  }, []);

  /**
   * Session'a geçiş yapar ve detayları yükler
   */
  const switchSession = useCallback(async (customId: string, params?: SessionDetailParams) => {
    const sessionSummary = state.sessions.find(s => s.id === customId);
    
    if (!sessionSummary?._id) {
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: customId });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: customId });

    try {
      // Paralel olarak tüm detayları fetch et
      const [consoleData, networkData, domData, rrwebData] = await Promise.all([
        sessionsApi.getConsoleLogs(sessionSummary._id, {
          consoleLogsPage: params?.consoleLogsPage || 1,
          consoleLogsLimit: params?.consoleLogsLimit || 20,
          consoleLogsSearch: params?.consoleLogsSearch,
        }),
        sessionsApi.getNetworkLogs(sessionSummary._id, {
          networkLogsPage: params?.networkLogsPage || 1,
          networkLogsLimit: params?.networkLogsLimit || 20,
          networkLogsSearch: params?.networkLogsSearch,
        }),
        sessionsApi.getDomEvents(sessionSummary._id, {
          domEventsPage: params?.domEventsPage || 1,
          domEventsLimit: params?.domEventsLimit || 20,
          domEventsSearch: params?.domEventsSearch,
        }),
        sessionsApi.getRrwebEvents(sessionSummary._id),
      ]);

      const detailedSession: Session = {
        ...sessionSummary,
        consoleLogs: consoleData.items || [],
        networkLogs: networkData.items || [],
        domEvents: domData.items || [],
        rrwebEvents: rrwebData || [],
        consoleLogsPagination: consoleData.pagination,
        networkLogsPagination: networkData.pagination,
        domEventsPagination: domData.pagination,
      };

      dispatch({ type: 'SET_SESSION_DETAILS', payload: { id: customId, session: detailedSession } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Session detayları yüklenemedi' });
    }
  }, [state.sessions]);

  /**
   * Session'ı siler
   */
  const deleteSession = useCallback(async (customId: string) => {
    const sessionToDelete = state.sessions.find(s => s.id === customId);
    
    if (sessionToDelete?._id) {
      try {
        await sessionsApi.deleteSession(sessionToDelete._id);
        
        // Silme başarılı olduktan sonra listeyi yeniden çek
        // Mevcut sayfa ve limit değerleriyle güncelle
        const { page, limit } = state.pagination;
        
        // Eğer sayfadaki son item silindiyse ve ilk sayfa değilse, önceki sayfaya git
        const isLastItemOnPage = state.sessions.length === 1;
        const targetPage = isLastItemOnPage && page > 1 ? page - 1 : page;
        
        await fetchSessions(targetPage, limit);
      } catch (error) {
        console.error('Session silme hatası:', error);
        // Hata durumunda da local state'ten sil
        dispatch({ type: 'REMOVE_SESSION', payload: customId });
      }
    } else {
      // Backend'de kayıtlı değilse sadece local state'ten sil
      dispatch({ type: 'REMOVE_SESSION', payload: customId });
    }
  }, [state.sessions, state.pagination, fetchSessions]);

  /**
   * Aktif session'dan çıkış
   */
  const exitSession = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: null });
  }, []);

  /**
   * Session'ı günceller
   */
  const updateSession = useCallback(async (customId: string, data: Partial<Session>) => {
    const session = state.sessions.find(s => s.id === customId);
    
    if (session?._id) {
      try {
        const updated = await sessionsApi.updateSession(session._id, data);
        dispatch({ type: 'UPDATE_SESSION', payload: { id: customId, data: updated } });
      } catch (error) {
        console.error('Session güncelleme hatası:', error);
      }
    }
  }, [state.sessions]);

  /**
   * rrweb event'lerini fetch eder
   */
  const fetchRrwebEvents = useCallback(async (customId: string): Promise<unknown[]> => {
    const session = state.sessions.find(s => s.id === customId);
    
    if (!session?._id) {
      return [];
    }

    try {
      const events = await sessionsApi.getRrwebEvents(session._id);
      
      dispatch({
        type: 'UPDATE_SESSION',
        payload: { id: customId, data: { rrwebEvents: events } },
      });
      
      return events;
    } catch (error) {
      console.error('rrweb events fetch hatası:', error);
      return [];
    }
  }, [state.sessions]);

  /**
   * Network log detaylarını fetch eder
   */
  const fetchNetworkDetails = useCallback(async (mongoId: string, networkLogId: string): Promise<unknown[]> => {
    try {
      const data = await sessionsApi.getNetworkLogDetails(mongoId, networkLogId);
      return data.items || [];
    } catch (error) {
      console.error('Network details fetch hatası:', error);
      return [];
    }
  }, []);

  // Aktif session'ı hesapla
  const currentSession = useMemo(
    () => state.sessions.find(s => s.id === state.activeSessionId),
    [state.sessions, state.activeSessionId]
  );

  // Context value - memoized
  const value = useMemo<SessionContextValue>(() => ({
    state,
    fetchSessions,
    fetchGlobalStats,
    createSession,
    deleteSession,
    updateSession,
    switchSession,
    exitSession,
    fetchRrwebEvents,
    fetchNetworkDetails,
    currentSession,
  }), [
    state,
    fetchSessions,
    fetchGlobalStats,
    createSession,
    deleteSession,
    updateSession,
    switchSession,
    exitSession,
    fetchRrwebEvents,
    fetchNetworkDetails,
    currentSession,
  ]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSessionContext hook - Context'e erişim sağlar
 * 
 * Bu hook yalnızca SessionProvider içinde kullanılabilir.
 * Provider dışında çağrılırsa hata fırlatır.
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  
  return context;
}
