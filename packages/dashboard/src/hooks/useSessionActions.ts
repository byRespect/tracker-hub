/**
 * useSessionActions Hook - Session işlemleri için convenience wrapper
 * 
 * SessionContext'i kullanarak session CRUD ve navigation işlemlerini
 * component'lere expose eder. Legacy useSystemCapture hook'u ile
 * aynı interface'i sağlar.
 */

import { useSessionContext } from '../store';

export function useSessionActions() {
  const {
    state,
    fetchSessions,
    createSession,
    deleteSession,
    switchSession,
    exitSession,
    fetchRrwebEvents,
    fetchNetworkDetails,
    currentSession,
  } = useSessionContext();

  return {
    // State
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
    loading: state.loading,
    error: state.error,
    currentPage: state.pagination.page,
    totalPages: state.pagination.totalPages,
    
    // Actions
    createSession,
    switchSession,
    deleteSession,
    exitSession,
    fetchRrwebEvents,
    fetchNetworkDetails,
    fetchSessions,
    
    // Computed
    currentSession,
  };
}
