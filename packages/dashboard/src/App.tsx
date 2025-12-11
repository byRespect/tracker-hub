/**
 * App - Ana uygulama bileşeni
 * 
 * Session yönetimi ve view routing bu component'te handle edilir.
 * Dashboard (session listesi) ve session detail view'ları arasında geçiş yapar.
 */

import React, { useState } from 'react';
import type { ViewMode, Session, SessionAnalytics } from './types';
import { useSessionContext } from './store';
import { generateSessionAnalytics } from './utils';
import { ConsolePanel } from './components/ConsolePanel';
import { NetworkPanel } from './components/NetworkPanel';
import { SessionPanel } from './components/SessionPanel';
import { OverviewPanel } from './components/OverviewPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { Layout, Terminal, Activity, Wifi, ArrowLeft, Layers, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('overview');
  const [sessionLimit, setSessionLimit] = useState(12);

  const { 
    state,
    currentSession,
    createSession, 
    switchSession, 
    deleteSession,
    exitSession,
    fetchRrwebEvents,
    fetchNetworkDetails,
    fetchSessions,
  } = useSessionContext();

  // İlk yükleme - doğru limit ile session listesini getir (sadece bir kez)
  React.useEffect(() => {
    fetchSessions(1, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDashboardSessionSelect = (id: string, initialView?: ViewMode) => {
      switchSession(id);
      setView(initialView || 'overview');
  };

  const handlePageChange = (page: number) => {
      fetchSessions(page, sessionLimit);
  };

  const handleLimitChange = (limit: number) => {
      setSessionLimit(limit);
      fetchSessions(1, limit);
  };

  // Session seçili değilse Dashboard göster
  if (!state.activeSessionId || !currentSession) {
      return (
          <DashboardPanel 
            sessions={state.sessions}
            onCreateSession={createSession}
            onSelectSession={handleDashboardSessionSelect}
            onDeleteSession={deleteSession}
            pagination={{
                page: state.pagination.page,
                limit: sessionLimit,
                total: state.pagination.total,
                totalPages: state.pagination.totalPages
            }}
            globalStats={state.globalStats}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
      );
  }

  // Aktif session için analytics hesapla
  const analytics = generateSessionAnalytics(currentSession);

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
      <div className="hidden md:flex w-20 flex-col items-center py-6 bg-[#0b1120] border-r border-white/5 space-y-8 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        {/* Back to Dashboard */}
        <button 
            onClick={exitSession}
            className="p-3 mb-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors tooltip-trigger"
            title="Back to Dashboard"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="h-px w-10 bg-slate-800" />
        
        <nav className="flex flex-col w-full gap-6 items-center">
          <NavButton 
            active={view === 'overview'} 
            onClick={() => setView('overview')} 
            icon={<Layout className="w-5 h-5" />} 
            label="Overview" 
          />
          <NavButton 
            active={view === 'console'} 
            onClick={() => setView('console')} 
            icon={<Terminal className="w-5 h-5" />} 
            label="Console" 
            count={currentSession.consoleLogs?.length || 0}
            color="text-amber-400"
          />
          <NavButton 
            active={view === 'network'} 
            onClick={() => setView('network')} 
            icon={<Wifi className="w-5 h-5" />} 
            label="Network"
            count={currentSession.networkLogs?.length || 0}
            color="text-cyan-400"
          />
          <NavButton 
            active={view === 'session'} 
            onClick={() => setView('session')} 
            icon={<Activity className="w-5 h-5" />} 
            label="Session"
            color="text-emerald-400"
          />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Status Bar (Session Info) */}
        <div className="h-14 md:h-10 border-b border-slate-800 bg-[#0f172a] flex items-center px-4 md:px-6 justify-between text-xs relative z-20 shrink-0">
            <div className="flex items-center gap-2 text-slate-400 max-w-[70%]">
                 {/* Mobile Back Button */}
                <button 
                    onClick={exitSession}
                    className="md:hidden mr-2 p-1.5 -ml-2 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <Layers className="w-3 h-3 hidden md:block" />
                <span className="opacity-50 hidden md:inline">Active Session:</span>
                <span className="font-bold text-white truncate">{currentSession.name || 'Untitled Session'}</span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px]">{currentSession.id}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
                <span className="hidden sm:inline">{new Date(currentSession.timestamp || Date.now()).toLocaleString()}</span>
                <span className="sm:hidden">{new Date(currentSession.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
        </div>

        {/* Content Render - Added padding bottom for mobile nav */}
        <main className="flex-1 overflow-hidden relative z-10 animate-in fade-in duration-300 pb-[60px] md:pb-0">
          {view === 'overview' && <OverviewPanel analytics={analytics} />}
          {view === 'console' && <ConsolePanel logs={currentSession.consoleLogs || []} />}
          {view === 'network' && (
            <NetworkPanel 
              requests={currentSession.networkLogs || []} 
              sessionId={currentSession._id}
              fetchNetworkDetails={fetchNetworkDetails}
            />
          )}
          {view === 'session' && (
            <SessionPanel 
                events={currentSession.domEvents || []} 
                rrwebEvents={currentSession.rrwebEvents || []} 
                consoleLogs={currentSession.consoleLogs || []}
                sessionId={currentSession.id}
                fetchRrwebEvents={fetchRrwebEvents}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800 z-50 flex items-center justify-around px-2 pb-safe">
            <MobileNavButton 
                active={view === 'overview'} 
                onClick={() => setView('overview')} 
                icon={<Layout className="w-5 h-5" />} 
                label="Home"
            />
            <MobileNavButton 
                active={view === 'console'} 
                onClick={() => setView('console')} 
                icon={<Terminal className="w-5 h-5" />} 
                label="Console"
                count={currentSession.consoleLogs?.length || 0}
                color="text-amber-400"
                alert={currentSession.consoleLogs?.some(l => l.method === 'error')}
            />
            <MobileNavButton 
                active={view === 'network'} 
                onClick={() => setView('network')} 
                icon={<Wifi className="w-5 h-5" />} 
                label="Network"
                count={currentSession.networkLogs?.length || 0}
                color="text-cyan-400"
            />
            <MobileNavButton 
                active={view === 'session'} 
                onClick={() => setView('session')} 
                icon={<Activity className="w-5 h-5" />} 
                label="Replay"
            />
        </div>
      </div>
    </div>
  );
};

// Desktop Nav Button
const NavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
    color?: string;
}> = ({ active, onClick, icon, label, count, color = "text-blue-400" }) => (
    <button
        onClick={onClick}
        className={`relative group flex flex-col items-center gap-1.5 transition-all duration-300 ${
            active 
            ? 'scale-110' 
            : 'opacity-60 hover:opacity-100 hover:scale-105'
        }`}
    >
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
            active 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-black/50 border border-slate-700 text-white' 
            : 'text-slate-400 hover:bg-slate-800/50'
        }`}>
            {icon}
        </div>
        
        <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        
        {count !== undefined && count > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold bg-slate-900 border border-slate-800 ${color}`}>
                {count > 99 ? '99+' : count}
            </span>
        )}
        
        {active && (
             <div className="absolute top-3 -left-4 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        )}
    </button>
);

// Mobile Nav Button
const MobileNavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
    alert?: boolean;
    color?: string;
}> = ({ active, onClick, icon, label, count, alert, color = "text-blue-400" }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
            active ? 'text-blue-400' : 'text-slate-500'
        }`}
    >
        <div className={`relative p-1 rounded-lg transition-all ${active ? 'bg-blue-500/10' : ''}`}>
            {icon}
            
            {/* Count Badge */}
            {count !== undefined && count > 0 && (
                <span className={`absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold bg-slate-900 border border-slate-800 shadow-sm px-1 z-10 ${color}`}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
            
            {/* Fallback Alert Dot if no count but alert is active (e.g. error state) */}
            {(!count && alert) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0f172a]" />
            )}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default App;
