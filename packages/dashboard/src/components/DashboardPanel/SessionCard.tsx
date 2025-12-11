/**
 * SessionCard Component
 *
 * Dashboard grid'inde tek bir session card'ı görüntüler.
 * Session detaylarına hızlı navigasyon ve silme aksiyonu sağlar.
 */

import React, { useState } from 'react';
import { Session, ViewMode } from '../../types';
import { Activity, Clock } from 'lucide-react';

/**
 * SessionCard component props'ları
 */
export interface SessionCardProps {
  /** Gösterilecek session verisi */
  session: Session;
  /** Session seçildiğinde çağrılacak callback */
  onSelect: (id: string, view?: ViewMode) => void;
  /** Silme istendiğinde çağrılacak callback */
  onDelete: (id: string) => void;
}

/**
 * SessionCard - Grid'de gösterilen tekil session card'ı
 *
 * Gösterir:
 * - Session adı ve kullanıcı
 * - Durum göstergesi
 * - Hızlı istatistikler (request'ler, log'lar, error'lar)
 * - Session zaman damgası
 *
 * @component
 */
export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSelect,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.id);
  };

  const handleStatClick = (e: React.MouseEvent, view: ViewMode) => {
    e.stopPropagation();
    onSelect(session.id, view);
  };

  const totalNetworkLogs = session.totalNetworkLogs || session.networkLogs?.length || 0;
  const totalLogs = session.totalLogs || session.consoleLogs?.length || 0;
  const totalErrors =
    session.totalErrors || session.consoleLogs?.filter(l => l.method === 'error').length || 0;

  const sessionTime = new Date(session.timestamp || Date.now());
  const sessionDate = sessionTime.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  const sessionTimeStr = sessionTime.toLocaleTimeString();

  return (
    <div
      onClick={() => onSelect(session.id, 'overview')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-[#0f172a]/60 border border-slate-800 rounded-2xl p-0 cursor-pointer transition-all hover:bg-[#1e293b]/60 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-transparent relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3 w-full">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border border-slate-700/50 shrink-0 ${
                session.status === 'active'
                  ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {session.status === 'active' ? (
                <Activity className="w-5 h-5 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-200 group-hover:text-blue-200 transition-colors truncate text-sm">
                {session.name || 'Unnamed Session'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 truncate">
                {session.user?.email || 'Anonymous'}
              </p>
            </div>
          </div>

          {/* Delete button - visible on hover */}
          {isHovered && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors ml-2"
              title="Delete session"
              aria-label="Delete session"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
              </svg>
            </button>
          )}
        </div>

        {/* Active indicator glow */}
        {session.status === 'active' && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-900/30">
        <StatGridCell
          label="Reqs"
          value={totalNetworkLogs}
          color="cyan"
          onClick={(e) => handleStatClick(e, 'network')}
        />
        <StatGridCell
          label="Logs"
          value={totalLogs}
          color="amber"
          onClick={(e) => handleStatClick(e, 'console')}
        />
        <StatGridCell
          label="Errors"
          value={totalErrors}
          color="red"
          onClick={(e) => handleStatClick(e, 'console')}
        />
      </div>

      {/* Footer with ID and timestamp */}
      <div className="px-5 py-3 text-[10px] text-slate-600 font-mono flex justify-between items-center bg-[#020617]/50">
        <span className="truncate mr-2">ID: {session.id}</span>
        <span className="whitespace-nowrap">
          {sessionTimeStr} {sessionDate}
        </span>
      </div>
    </div>
  );
};

/**
 * Props for stat grid cell
 */
interface StatGridCellProps {
  /** Cell label */
  label: string;
  /** Value to display */
  value: number;
  /** Color theme */
  color: 'cyan' | 'amber' | 'red';
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
}

/**
 * StatGridCell - Individual stat in the session card grid
 */
const StatGridCell: React.FC<StatGridCellProps> = ({ label, value, color, onClick }) => {
  const colorMap = {
    cyan: { text: 'text-cyan-400', hover: 'group-hover/stat:text-cyan-400/70' },
    amber: { text: 'text-amber-400', hover: 'group-hover/stat:text-amber-400/70' },
    red: { text: 'text-red-400', hover: 'group-hover/stat:text-red-400/70' },
  };

  const { text, hover } = colorMap[color];

  return (
    <div
      onClick={onClick}
      className="p-3 text-center group/stat hover:bg-slate-800/80 transition-colors cursor-pointer"
    >
      <div className={`text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold ${hover} transition-colors`}>
        {label}
      </div>
      <div className={`font-mono text-sm ${text} group-hover/stat:scale-110 transition-transform`}>
        {value}
      </div>
    </div>
  );
};
