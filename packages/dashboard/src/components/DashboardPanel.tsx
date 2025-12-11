/**
 * DashboardPanel Ana Component
 *
 * Toplu session metriklerini ve interaktif session grid'ini görüntüler.
 * Özellikler:
 * - Gerçek zamanlı istatistikler (request'ler, log'lar, error'lar, session'lar)
 * - Traffic hacim görselleştirmesi
 * - Sistem sağlık göstergeleri
 * - Hızlı aksiyonlu session card'ları
 */

import React, { useMemo, useState } from 'react';
import { Session, ViewMode, PaginationMeta } from '../types';
import {
  Cpu,
  BarChart3,
  TrendingUp,
  Zap,
  Layers,
} from 'lucide-react';
import { Pagination } from './Pagination';
import { StatCard, SimpleSparkline } from './DashboardPanel/StatCard';
import { SessionCard } from './DashboardPanel/SessionCard';
import { DeleteConfirmationModal } from './DashboardPanel/DeleteConfirmationModal';
import { APP_CONFIG } from '../constants';

// Tüm session'lardan toplanan global istatistik tipi
interface GlobalStats {
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
 * DashboardPanel component props'ları
 */
export interface DashboardPanelProps {
  /** Gösterilecek session'lar dizisi */
  sessions: Session[];
  /** Yeni session oluşturmak için callback */
  onCreateSession: (name: string) => void;
  /** Session seçildiğinde çağrılacak callback */
  onSelectSession: (id: string, initialView?: ViewMode) => void;
  /** Session silmek için callback */
  onDeleteSession: (id: string) => void;
  /** Pagination metadata'sı */
  pagination?: PaginationMeta;
  /** Tüm session'lardan global istatistikler */
  globalStats?: GlobalStats;
  /** Pagination sayfa değiştiğinde callback */
  onPageChange?: (page: number) => void;
  /** Sayfa başına öğe sayısı değiştiğinde callback */
  onLimitChange?: (limit: number) => void;
}

/**
 * DashboardPanel Component
 *
 * Şunları gösteren ana dashboard görünümü:
 * - Sistem durumu ve versiyon bilgisi
 * - Toplu metrikler (request'ler, log'lar, error'lar, session'lar)
 * - Traffic hacim chart'ı
 * - Sistem sağlık durumu
 * - İnteraktif session grid'i
 *
 * @component
 * @example
 * ```tsx
 * <DashboardPanel
 *   sessions={sessionsList}
 *   onSelectSession={handleSelectSession}
 *   onDeleteSession={handleDeleteSession}
 *   pagination={paginationData}
 *   onPageChange={handlePageChange}
 * />
 * ```
 */
export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  pagination,
  globalStats,
  onPageChange,
  onLimitChange,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  /**
   * Compute aggregate statistics across all sessions
   * Global stats varsa backend'den gelen değerleri kullan, yoksa mevcut sayfadan hesapla
   */
  const stats = useMemo(() => {
    // Global değerler - backend'den veya sayfa verilerinden
    const totalSessions = globalStats?.totalSessions ?? pagination?.total ?? sessions.length;
    const totalErrors = globalStats?.totalErrors ?? sessions.reduce((acc, s) => acc + (s.totalErrors || 0), 0);
    const totalRequests = globalStats?.totalRequests ?? sessions.reduce((acc, s) => acc + (s.totalNetworkLogs || 0), 0);
    const totalLogs = globalStats?.totalLogs ?? sessions.reduce((acc, s) => acc + (s.totalLogs || 0), 0);

    // Trend değerleri - backend'den veya fallback
    const requestsTrend = globalStats?.trends?.requests ?? { percent: '0%', isUp: true };
    const logsTrend = globalStats?.trends?.logs ?? { percent: '0%', isUp: true };
    const errorsTrend = globalStats?.trends?.errors ?? { percent: '0%', isUp: true };

    // Session trend: Sayfa bazlı değerlendirme (bu hala sayfa bazlı kalacak)
    const currentPage = pagination?.page || 1;
    const sessionsTrend = {
      percent: currentPage === 1 ? 'Latest' : `Page ${currentPage}`,
      isUp: true,
    };

    // Haftalık network traffic verisi - backend'den veya fallback
    const weeklyTraffic = globalStats?.weeklyTraffic ?? [0, 0, 0, 0, 0, 0, 0];

    return {
      totalSessions,
      totalErrors,
      totalRequests,
      totalLogs,
      weeklyTraffic,
      requestsTrend,
      logsTrend,
      errorsTrend,
      sessionsTrend,
    };
  }, [sessions, pagination, globalStats]);

  /**
   * Handle delete confirmation action
   */
  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] relative overflow-hidden">
      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-10">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wider uppercase">
                  v{APP_CONFIG.VERSION} {APP_CONFIG.STATUS}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold tracking-wider uppercase">
                  {APP_CONFIG.SYSTEM_STATUS}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                  TrackerHub
                </span>
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
                Real-time telemetry aggregation and session replay management.
                Monitoring active sessions across the distributed network.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests.toLocaleString()}
            icon={<Zap className="w-5 h-5 text-cyan-400" />}
            trend={stats.requestsTrend.percent}
            trendUp={stats.requestsTrend.isUp}
            color="cyan"
          />
          <StatCard
            title="Captured Logs"
            value={stats.totalLogs.toLocaleString()}
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            trend={stats.logsTrend.percent}
            trendUp={stats.logsTrend.isUp}
            color="amber"
          />
          <StatCard
            title="Global Errors"
            value={stats.totalErrors.toLocaleString()}
            icon={<Zap className="w-5 h-5 text-red-400" />}
            trend={stats.errorsTrend.percent}
            trendUp={!stats.errorsTrend.isUp}
            color="red"
          />
          <StatCard
            title="Visible Sessions"
            value={sessions.length.toString()}
            icon={<Zap className="w-5 h-5 text-emerald-400" />}
            trend={stats.sessionsTrend.percent}
            trendUp={stats.sessionsTrend.isUp}
            color="emerald"
          />
        </div>

        {/* Visualizations Row */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Traffic Volume Chart */}
          <div className="lg:col-span-2 bg-[#0f172a]/60 border border-slate-800 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-blue-500" />
            </div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" /> Network Traffic Density
                </h3>
                <p className="text-xs text-slate-500">Request volume across recent sessions</p>
              </div>
            </div>
            <div className="h-32 w-full flex items-end gap-1">
              <SimpleSparkline data={stats.weeklyTraffic} color="#3b82f6" />
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#0f172a]/60 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-slate-200 font-semibold flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-purple-400" /> System Health
              </h3>
              <p className="text-xs text-slate-500 mb-6">Error vs Success Ratio</p>
            </div>

            <div className="space-y-4">
              {/* Success operations bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Successful Operations</span>
                  <span className="text-emerald-400 font-mono">
                    {Math.max((stats.totalRequests - stats.totalErrors), 0)}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500"
                    style={{
                      width: `${stats.totalRequests > 0
                        ? Math.max(((stats.totalRequests - stats.totalErrors) / stats.totalRequests) * 100, 0)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Critical failures bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Critical Failures</span>
                  <span className="text-red-400 font-mono">{stats.totalErrors}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (stats.totalErrors / (stats.totalRequests || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Section Header */}
        <div className="max-w-7xl mx-auto w-full mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" /> Recent Sessions
          </h2>
        </div>

        {/* Sessions Grid */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Empty State */}
          {sessions.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <Cpu className="w-16 h-16 mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl text-slate-400 font-semibold mb-2">
                No Active Sessions
              </h3>
              <p className="text-slate-600 mb-6">
                Waiting for incoming telemetry connections...
              </p>
            </div>
          )}

          {/* Session Cards */}
          {sessions.map(session => (
            <SessionCard
              key={session._id || session.id}
              session={session}
              onSelect={onSelectSession}
              onDelete={setSessionToDelete}
            />
          ))}
        </div>

        {/* Pagination */}
        {pagination && onPageChange && (
          <div className="max-w-7xl mx-auto w-full mt-8 mb-4">
            <div className="bg-[#0f172a]/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <Pagination
                pagination={pagination}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                showLimitSelector={!!onLimitChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        sessionId={sessionToDelete || ''}
        isOpen={!!sessionToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};
