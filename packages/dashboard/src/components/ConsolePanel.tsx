
import React, { useState } from 'react';
import { ConsoleLog, PaginationMeta } from '../types';
import { analyzeError } from '../services/geminiService';
import { AlertCircle, Info, Terminal, Search, Bot, Filter, ChevronRight, ChevronDown, Clock, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Pagination } from './Pagination';

interface Props {
  logs: ConsoleLog[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
}

// --- Helper Component for Log Arguments ---

const LogValue: React.FC<{ value: any }> = ({ value }) => {
  const [expanded, setExpanded] = useState(false);

  const isObject = typeof value === 'object' && value !== null;
  const stringValue = isObject ? JSON.stringify(value) : String(value);
  const isLongString = !isObject && stringValue.length > 100;

  // Simple render for short primitives
  if (!isObject && !isLongString) {
    let colorClass = 'text-slate-300';
    if (typeof value === 'number') colorClass = 'text-orange-400';
    if (typeof value === 'boolean') colorClass = 'text-red-400';
    if (value === null || value === undefined) colorClass = 'text-slate-500';

    return <span className={`mr-2 whitespace-pre-wrap break-words ${colorClass}`}>{stringValue}</span>;
  }

  // Handle Objects and Long Strings
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const renderPreview = () => {
    if (isObject) {
      const isArray = Array.isArray(value);
      const keys = Object.keys(value);
      const label = isArray ? `Array(${value.length})` : 'Object';

      // Create a short preview of content like { id: 1, name: ... }
      let preview = '';
      try {
        if (isArray) {
          preview = `[ ${value.map((v: any) => typeof v === 'object' ? '{...}' : String(v)).slice(0, 3).join(', ')}${value.length > 3 ? ', ...' : ''} ]`;
        } else {
          preview = `{ ${keys.slice(0, 3).map(k => `${k}: ${typeof value[k] === 'object' ? '{...}' : String(value[k])}`).join(', ')}${keys.length > 3 ? ', ...' : ''} }`;
        }
      } catch (e) {
        preview = '...';
      }

      return (
        <span className="text-slate-400 font-mono text-[11px] break-all">
          <span className="text-purple-400 italic mr-1">{label}</span>
          <span className="opacity-70">{preview}</span>
        </span>
      );
    }

    // Long string preview
    return (
      <span className="text-slate-300 break-words">
        {stringValue.slice(0, 100)}
        <span className="text-slate-500 bg-slate-800/50 px-1 rounded ml-1 text-[10px] cursor-pointer hover:text-blue-400 whitespace-nowrap">...show more</span>
      </span>
    );
  };

  return (
    <div className="inline-block align-top mr-2 mb-1 max-w-full">
      <div
        className="flex items-start cursor-pointer hover:bg-slate-800/50 rounded px-1 -ml-1 transition-colors select-text"
        onClick={toggle}
      >
        <span className="mt-0.5 mr-1 text-slate-500 shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>

        {!expanded ? renderPreview() : (
          <div className="flex-1 min-w-0">
            {/* If it was just a long string, show text. If object, formatted JSON */}
            {isObject ? (
              <div className="text-slate-300 font-mono text-[11px] bg-[#0b1120] p-2 rounded border border-slate-800/50 mt-1 overflow-x-auto">
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </div>
            ) : (
              <span className="whitespace-pre-wrap text-slate-300 break-words">{stringValue}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

export const ConsolePanel: React.FC<Props> = ({
  logs,
  pagination,
  onPageChange,
  onLimitChange,
  onSearchChange,
  loading = false
}) => {
  const [localFilter, setLocalFilter] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ id: string, text: string } | null>(null);

  // Use pagination search if available, otherwise local filter
  const searchValue = pagination?.search || localFilter;
  const filteredLogs = pagination ? logs : logs.filter(log =>
    JSON.stringify(log.args).toLowerCase().includes(localFilter.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalFilter(value);
    }
  };

  const handleAnalyze = async (log: ConsoleLog) => {
    setAnalyzingId(log.id);
    setAnalysisResult(null);
    const result = await analyzeError(log);
    setAnalysisResult({ id: log.id, text: result });
    setAnalyzingId(null);
  };

  const getIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'info': return <Info className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Info className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getStyles = (method: string) => {
    switch (method.toLowerCase()) {
      case 'error': return 'bg-red-500/5 border-l-red-500/50 hover:bg-red-500/10';
      case 'warn': return 'bg-amber-500/5 border-l-amber-500/50 hover:bg-amber-500/10';
      case 'info': return 'bg-blue-500/5 border-l-blue-500/50 hover:bg-blue-500/10';
      default: return 'bg-transparent border-l-transparent hover:bg-slate-800/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-4 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Console</span>
        </div>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter logs..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
            value={searchValue}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-y-auto p-2 md:p-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs">Loading logs...</span>
            </div>
          </div>
        )}

        {filteredLogs.map(log => (
          <div
            key={log.id}
            className={`
                group relative
                flex flex-col md:flex-row md:items-start
                p-3 md:px-3 md:py-1
                mb-2 md:mb-0
                rounded-lg md:rounded-none
                border border-slate-800/50 md:border-0 md:border-b md:border-slate-800/30
                border-l-[3px] md:border-l-[3px]
                text-xs font-mono 
                transition-colors
                ${getStyles(log.method)}
            `}
          >
            {/* Mobile Header: Icon + Method + Time */}
            <div className="flex md:hidden justify-between items-center mb-2 pb-2 border-b border-slate-800/30">
              <div className="flex items-center gap-2">
                {getIcon(log.method)}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${log.method === 'error' ? 'text-red-400' :
                  log.method === 'warn' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                  {log.method}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Desktop: Icon Column */}
            <div className="hidden md:flex items-start justify-center pt-1 shrink-0 w-6">
              {getIcon(log.method)}
            </div>

            {/* Desktop: Time Column */}
            <div className="hidden md:block text-slate-500 pt-1 shrink-0 w-[85px] text-[11px] font-sans">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-start leading-relaxed">
                {log.args.map((msg, i) => (
                  <LogValue key={i} value={msg} />
                ))}
              </div>

              {/* Stack Trace if available */}
              {log.stack && (
                <div className="w-full mt-1 pl-3 border-l-2 border-slate-700/50 overflow-x-auto text-slate-500">
                  <LogValue value={log.stack} />
                </div>
              )}

              {/* AI Analysis Result */}
              {analysisResult?.id === log.id && (
                <div className="w-full mt-2 mb-2 p-3 bg-slate-900/95 rounded border border-purple-500/30 text-slate-300 relative overflow-hidden shadow-lg shadow-purple-900/20">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                  <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold uppercase text-[10px] tracking-widest font-sans">
                    <Bot className="w-3 h-3" /> Gemini Insight
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none text-[11px] leading-relaxed font-sans">
                    <ReactMarkdown>{analysisResult.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Column (AI Button) */}
            <div className="mt-3 md:mt-0 md:ml-2 flex items-start justify-end md:w-auto shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {log.method === 'error' && (
                <button
                  onClick={() => handleAnalyze(log)}
                  disabled={analyzingId === log.id}
                  className="flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 md:px-2 md:py-0.5 rounded md:rounded-md text-[10px] font-semibold tracking-wide transition-all w-full md:w-auto font-sans"
                >
                  <Bot className="w-3.5 h-3.5 md:w-3 md:h-3" />
                  {analyzingId === log.id ? 'Thinking...' : 'Analyze'}
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600">
            <Filter className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs">{searchValue ? 'No logs match your search' : 'No logs found'}</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          showLimitSelector={!!onLimitChange}
        />
      )}
    </div>
  );
};
