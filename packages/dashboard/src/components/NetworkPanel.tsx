
import React, { useState, useMemo, useEffect } from 'react';
import { NetworkLog, PaginationMeta } from '../types';
import { analyzeNetworkFailure } from '../services/geminiService';
import { SimulatorPanel, SimulationPreset } from './SimulatorPanel';
import { ArrowUpRight, ArrowDownLeft, Zap, Globe, AlertCircle, Play, CheckCircle2, Copy, LayoutList, FileCode, Bot, Code, AlignLeft, ChevronRight, ChevronDown, Braces, Rocket, ArrowLeft, X, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Pagination } from './Pagination';

interface Props {
    requests: NetworkLog[];
    pagination?: PaginationMeta;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    onSearchChange?: (search: string) => void;
    loading?: boolean;
    sessionId?: string;
    fetchNetworkDetails?: (sessionId: string, networkLogId: string) => Promise<any[]>;
}

const JsonPrimitive: React.FC<{ value: any }> = ({ value }) => {
    if (value === null) return <span className="text-slate-500">null</span>;
    if (value === undefined) return <span className="text-slate-600">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-red-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-orange-400">{value}</span>;
    if (typeof value === 'string') return <span className="text-green-400">"{value}"</span>;
    return <span className="text-slate-300">{String(value)}</span>;
};

const JsonTree: React.FC<{ data: any; name?: string; isLast?: boolean; depth?: number }> = ({ data, name, isLast, depth = 0 }) => {
    const [expanded, setExpanded] = useState(depth < 1);

    if (typeof data !== 'object' || data === null) {
        return (
            <div className="font-mono text-xs leading-5 hover:bg-white/5 px-1 rounded flex items-center">
                {name && <span className="text-blue-300 mr-1">{name}:</span>}
                <JsonPrimitive value={data} />
                {!isLast && <span className="text-slate-500">,</span>}
            </div>
        );
    }

    const isArray = Array.isArray(data);
    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;
    const startBracket = isArray ? '[' : '{';
    const endBracket = isArray ? ']' : '}';

    if (isEmpty) {
        return (
            <div className="font-mono text-xs leading-5 hover:bg-white/5 px-1 rounded flex items-center">
                {name && <span className="text-blue-300 mr-1">{name}:</span>}
                <span className="text-slate-400">{startBracket}{endBracket}</span>
                {!isLast && <span className="text-slate-500">,</span>}
            </div>
        );
    }

    return (
        <div className="font-mono text-xs leading-5">
            <div
                className="hover:bg-white/5 px-1 rounded flex items-center cursor-pointer select-none group"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
                <span className="mr-1 text-slate-500 transform transition-transform duration-200" style={{ rotate: expanded ? '90deg' : '0deg' }}>
                    <ChevronRight className="w-3 h-3" />
                </span>
                {name && <span className="text-blue-300 mr-1 group-hover:text-blue-200">{name}:</span>}
                <span className="text-slate-400">{startBracket}</span>
                {!expanded && (
                    <span className="text-slate-600 mx-1 px-1 bg-white/5 rounded text-[10px]">
                        {isArray ? `${keys.length} items` : `${keys.length} keys`}
                    </span>
                )}
                {!expanded && <span className="text-slate-400">{endBracket}</span>}
                {!expanded && !isLast && <span className="text-slate-500">,</span>}
            </div>

            {expanded && (
                <div className="pl-4 border-l border-slate-800 ml-1.5">
                    {keys.map((key, index) => (
                        <JsonTree
                            key={key}
                            name={isArray ? undefined : key}
                            data={data[key]}
                            isLast={index === keys.length - 1}
                            depth={depth + 1}
                        />
                    ))}
                    <div className="hover:bg-white/5 px-1 rounded text-slate-400">
                        {endBracket}{!isLast && <span className="text-slate-500">,</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

const SyntaxHighlightedJson: React.FC<{ json: any }> = ({ json }) => {
    const jsonString = JSON.stringify(json, null, 2);
    const tokens = jsonString.split(/(".*?"|true|false|null|-?\d+\.?\d*|[\[\]\{\}:,])/g).filter(t => t.trim() !== '');

    return (
        <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {tokens.map((token, i) => {
                const nextToken = tokens[i + 1]?.trim();
                let colorClass = 'text-slate-300';

                if (token === ':') return <span key={i} className="text-slate-500">{token} </span>;
                if (token === ',') return <span key={i} className="text-slate-500">{token}</span>;

                if (token === 'true' || token === 'false') colorClass = 'text-red-400';
                else if (token === 'null') colorClass = 'text-slate-500';
                else if (!isNaN(Number(token))) colorClass = 'text-orange-400';
                else if (token.startsWith('"')) {
                    if (nextToken === ':') colorClass = 'text-blue-300';
                    else colorClass = 'text-green-400';
                }

                return <span key={i} className={colorClass}>{token}</span>;
            })}
        </div>
    );
};


// --- Main Component ---

export const NetworkPanel: React.FC<Props> = ({
    requests,
    pagination,
    onPageChange,
    onLimitChange,
    onSearchChange,
    loading = false,
    sessionId,
    fetchNetworkDetails
}) => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'simulator'>('monitor');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ id: string, text: string } | null>(null);
    const [bodyViewMode, setBodyViewMode] = useState<'pretty' | 'raw' | 'tree'>('pretty');
    const [simulationPreset, setSimulationPreset] = useState<SimulationPreset | null>(null);

    const [detailsLogs, setDetailsLogs] = useState<NetworkLog[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const getStatusColor = (status?: number, ok?: boolean) => {
        if (!status) return 'text-slate-500';
        if (ok) return 'text-emerald-400';
        if (status >= 400) return 'text-red-400';
        return 'text-amber-400';
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'websocket': return <Zap className="w-3 h-3 text-purple-400" />;
            case 'resource': return <FileCode className="w-3 h-3 text-amber-400" />;
            default: return <Globe className="w-3 h-3 text-blue-400" />;
        }
    };

    const handleAnalyze = async (req: NetworkLog) => {
        setAnalyzingId(req.id);
        const result = await analyzeNetworkFailure(req);
        setAnalysisResult({ id: req.id, text: result });
        setAnalyzingId(null);
    };

    const handleSimulateRequest = (req: NetworkLog) => {
        setSimulationPreset({
            method: req.method,
            url: req.url,
            headers: req.request?.headers,
            body: req.request?.body
        });
        setActiveTab('simulator');
    };

    useEffect(() => {
        if (selectedId && sessionId && fetchNetworkDetails) {
            setDetailsLoading(true);
            fetchNetworkDetails(sessionId, selectedId)
                .then(data => setDetailsLogs(data))
                .catch(err => console.error("Failed to fetch details", err))
                .finally(() => setDetailsLoading(false));
        } else {
            setDetailsLogs([]);
        }
    }, [selectedId, sessionId, fetchNetworkDetails]);

    const selectedReq = requests.find(r => r.id === selectedId);
    const detailedReq = detailsLogs.length > 0 ? detailsLogs[0] : selectedReq;

    const getBodyContent = (req: NetworkLog) => {
        if (!req.response) return null;
        if (req.response.body) return req.response.body;
        if (req.response.bodyTextSnippet) {
            try {
                return JSON.parse(req.response.bodyTextSnippet);
            } catch {
                return req.response.bodyTextSnippet;
            }
        }
        return null;
    };

    const wsConversation = useMemo(() => {
        if (!selectedReq || selectedReq.source !== 'websocket') return [];
        return detailsLogs
            .filter(r => r.source === 'websocket')
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedReq, detailsLogs]);

    const responseBodyContent = detailedReq ? getBodyContent(detailedReq) : null;
    const isJsonBody = responseBodyContent && typeof responseBodyContent === 'object';

    return (
        <div className="flex flex-col h-full bg-[#020617]">
            {/* Top Header */}
            <div className="h-14 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-200 hidden sm:inline">Network</span>
                    </div>

                    <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                        <button
                            onClick={() => setActiveTab('monitor')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'monitor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Monitor
                        </button>
                        <button
                            onClick={() => setActiveTab('simulator')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'simulator' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Simulate
                        </button>
                    </div>
                </div>

                {activeTab === 'monitor' && (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-slate-400 font-mono tracking-wide">{requests.length} CAPTURED</span>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'simulator' ? (
                    <SimulatorPanel prefillData={simulationPreset} />
                ) : (
                    <div className="flex h-full">
                        {/* Request List - Hidden on mobile if detail selected */}
                        <div className={`${selectedId ? 'hidden md:flex md:w-[40%]' : 'w-full'} flex flex-col border-r border-slate-800 transition-all duration-300`}>
                            {/* Search Bar */}
                            {(pagination || onSearchChange) && (
                                <div className="p-3 border-b border-slate-800 bg-slate-900/30">
                                    <input
                                        type="text"
                                        placeholder="Search requests..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                                        value={pagination?.search || ''}
                                        onChange={e => onSearchChange?.(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                                            <span className="text-xs">Loading requests...</span>
                                        </div>
                                    </div>
                                )}
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-[#0f172a] sticky top-0 text-slate-500 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-2 pl-4 font-medium w-8"></th>
                                            <th className="p-2 font-medium w-16">Status</th>
                                            <th className="p-2 font-medium w-16">Method</th>
                                            <th className="p-2 font-medium">Resource</th>
                                            <th className="p-2 font-medium text-right pr-4 hidden sm:table-cell">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map(req => (
                                            <tr
                                                key={req.id}
                                                onClick={() => setSelectedId(req.id)}
                                                className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selectedId === req.id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30 border-l-2 border-l-transparent'}`}
                                            >
                                                <td className="p-2 pl-4">
                                                    {getSourceIcon(req.source)}
                                                </td>
                                                <td className={`p-2 font-mono font-bold ${getStatusColor(req.status, req.ok)}`}>
                                                    {req.status || (req.source === 'websocket' ? '101' : '...')}
                                                </td>
                                                <td className="p-2 font-mono text-slate-400 font-semibold">{req.method}</td>
                                                <td className="p-2 truncate max-w-[150px] text-slate-300" title={req.url}>
                                                    {req.url.split('/').pop() || req.url}
                                                    <div className="text-[10px] text-slate-600 truncate max-w-[200px]">{req.url}</div>
                                                </td>
                                                <td className="p-2 text-right pr-4 text-slate-500 font-mono hidden sm:table-cell">
                                                    {req.durationMs ? `${Math.round(req.durationMs)}ms` : '...'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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

                        {/* Details Panel - Full screen on mobile */}
                        {(selectedId && selectedReq) && (
                            <div className={`
                        flex flex-col bg-[#020617] shadow-2xl z-30
                        fixed top-14 bottom-[60px] left-0 right-0 md:static md:w-[60%] md:border-l md:border-slate-800 md:inset-auto md:h-auto
                        animate-in slide-in-from-right duration-200
                    `}>
                                {detailsLoading && (
                                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col">
                                        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-2" />
                                        <span className="text-xs text-slate-400">Fetching details...</span>
                                    </div>
                                )}

                                {/* Detail Header */}
                                <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {/* Mobile Back Button */}
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>

                                        <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${getStatusColor(selectedReq.status, selectedReq.ok)} bg-slate-900 border border-slate-700`}>{selectedReq.method}</span>
                                        <span className="text-xs text-slate-400 truncate" title={selectedReq.url}>{selectedReq.url}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSimulateRequest(detailedReq || selectedReq)}
                                            className="p-1.5 hover:bg-purple-900/50 text-slate-400 hover:text-purple-400 rounded transition-colors flex items-center gap-1.5 border border-transparent hover:border-purple-500/30"
                                            title="Simulate Request"
                                        >
                                            <Rocket className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide hidden lg:block">Simulate</span>
                                        </button>
                                        <div className="w-px h-4 bg-slate-700 mx-1 hidden md:block" />
                                        <button onClick={() => setSelectedId(null)} className="hidden md:block p-1 hover:bg-slate-800 rounded text-slate-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {selectedReq.source === 'websocket' ? (
                                    // WebSocket Conversation View
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* WS Connection Info */}
                                        <div className="p-4 border-b border-slate-800 bg-slate-900/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <div className="text-slate-500 mb-1">Connection URL</div>
                                                <div className="text-slate-300 font-mono truncate">{selectedReq.url}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 mb-1">Session Duration</div>
                                                <div className="text-slate-300 font-mono">
                                                    {wsConversation.length > 0
                                                        ? `${Math.round((new Date(wsConversation[wsConversation.length - 1].timestamp).getTime() - new Date(wsConversation[0].timestamp).getTime()) / 1000)}s`
                                                        : '0s'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* WS Log Stream - Chat Style */}
                                        <div className="flex-1 overflow-y-auto p-4 bg-[#020617] custom-scrollbar">
                                            {wsConversation.length === 0 && !detailsLoading && (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2 opacity-50">
                                                    <MessageSquare className="w-8 h-8" />
                                                    <div className="text-xs">No messages in this session</div>
                                                </div>
                                            )}
                                            {wsConversation.map((log, index) => {
                                                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any);
                                                const type = log.meta?.ws?.type;

                                                // System Messages
                                                if (type === 'open' || type === 'close' || type === 'error') {
                                                    return (
                                                        <div key={`${log.id}-${index}`} className="flex justify-center my-4">
                                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 shadow-sm ${type === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                type === 'close' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                                }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${type === 'open' ? 'bg-emerald-500' :
                                                                    type === 'close' ? 'bg-red-500' : 'bg-amber-500'
                                                                    }`} />
                                                                <span>{type === 'open' ? 'Connection Established' : type === 'close' ? 'Connection Closed' : 'Error Occurred'}</span>
                                                                <span className="opacity-50 font-mono ml-1 border-l border-current pl-2">{timeStr}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Chat Bubbles
                                                const isOutgoing = log.meta?.ws?.direction === 'outgoing';
                                                return (
                                                    <div key={`${log.id}-${index}`} className={`flex w-full mb-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                                                            <div className={`
                                                        px-4 py-3 rounded-2xl text-xs font-mono shadow-md border relative break-all whitespace-pre-wrap leading-relaxed
                                                        ${isOutgoing
                                                                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tr-none'
                                                                    : 'bg-slate-800/80 border-slate-700 text-slate-200 rounded-tl-none'}
                                                     `}>
                                                                {log.meta?.ws?.messageSnippet}
                                                            </div>
                                                            <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider opacity-50 ${isOutgoing ? 'flex-row text-blue-300' : 'flex-row-reverse text-slate-400'}`}>
                                                                <span>{timeStr}</span>
                                                                {isOutgoing ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (detailedReq && (
                                    // HTTP Detail View
                                    <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6 text-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                            <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                                                <span className="text-slate-500 block mb-1">Source</span>
                                                <span className="text-slate-200 font-mono flex items-center gap-2">
                                                    {getSourceIcon(detailedReq.source)} {detailedReq.source.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                                                <span className="text-slate-500 block mb-1">Timestamp</span>
                                                <span className="text-slate-200 font-mono">
                                                    {new Date(detailedReq.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {detailedReq.meta && (
                                                <>
                                                    {detailedReq.meta.initiatorType && (
                                                        <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                                                            <span className="text-slate-500 block mb-1">Initiator</span>
                                                            <span className="text-slate-200 font-mono">{detailedReq.meta.initiatorType}</span>
                                                        </div>
                                                    )}
                                                    {detailedReq.meta.encodedBodySize !== undefined && (
                                                        <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                                                            <span className="text-slate-500 block mb-1">Size</span>
                                                            <span className="text-slate-200 font-mono">{detailedReq.meta.encodedBodySize} bytes</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* AI Analysis Box */}
                                        {(detailedReq.status && detailedReq.status >= 400) && (
                                            <div className="relative overflow-hidden bg-red-950/20 border border-red-500/20 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4" /> Diagnosis Required
                                                    </span>
                                                    <button
                                                        onClick={() => handleAnalyze(detailedReq)}
                                                        disabled={analyzingId === detailedReq.id}
                                                        className="text-xs bg-red-600/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-lg shadow-red-900/20"
                                                    >
                                                        <Bot className="w-3 h-3" /> {analyzingId === detailedReq.id ? 'Analyzing...' : 'Ask AI'}
                                                    </button>
                                                </div>
                                                {analysisResult?.id === detailedReq.id && (
                                                    <div className="text-xs text-slate-300 mt-2 bg-slate-950/50 p-3 rounded-lg border border-red-500/10 prose prose-invert max-w-none">
                                                        <ReactMarkdown>{analysisResult.text}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Headers */}
                                        <div className="grid grid-cols-1 gap-6">
                                            {detailedReq.request?.headers && Object.keys(detailedReq.request.headers).length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                                                        <ArrowUpRight className="w-3 h-3" /> Request Headers
                                                    </h3>
                                                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 max-h-40 overflow-auto custom-scrollbar">
                                                        <table className="w-full text-xs">
                                                            <tbody>
                                                                {Object.entries(detailedReq.request.headers).map(([k, v]) => (
                                                                    <tr key={k} className="border-b border-slate-800/50 last:border-0">
                                                                        <td className="py-1 pr-4 text-slate-400 font-mono select-all break-all w-1/3">{k}</td>
                                                                        <td className="py-1 text-slate-200 break-all select-all">{String(v)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {detailedReq.response?.headers && Object.keys(detailedReq.response.headers).length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                                                        <ArrowDownLeft className="w-3 h-3" /> Response Headers
                                                    </h3>
                                                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 max-h-40 overflow-auto custom-scrollbar">
                                                        <table className="w-full text-xs">
                                                            <tbody>
                                                                {Object.entries(detailedReq.response.headers).map(([k, v]) => (
                                                                    <tr key={k} className="border-b border-slate-800/50 last:border-0">
                                                                        <td className="py-1 pr-4 text-slate-400 font-mono select-all break-all w-1/3">{k}</td>
                                                                        <td className="py-1 text-slate-200 break-all select-all">{String(v)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body Section */}
                                        <div className="space-y-6">
                                            {detailedReq.request?.body && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Request Body</h3>
                                                        <button className="text-slate-600 hover:text-blue-400"><Copy className="w-3 h-3" /></button>
                                                    </div>
                                                    <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-3 overflow-x-auto relative group">
                                                        <pre className="text-xs text-blue-300 font-mono">
                                                            {typeof detailedReq.request.body === 'object' ? JSON.stringify(detailedReq.request.body, null, 2) : detailedReq.request.body}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}

                                            {(responseBodyContent) && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest px-2">Response Body</h3>
                                                            {isJsonBody && (
                                                                <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">
                                                                    {Array.isArray(responseBodyContent) ? `Array[${responseBodyContent.length}]` : 'Object'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800">
                                                            <button
                                                                onClick={() => setBodyViewMode('pretty')}
                                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${bodyViewMode === 'pretty' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                title="Pretty Print"
                                                            >
                                                                <Code className="w-3 h-3" />
                                                            </button>
                                                            {isJsonBody && (
                                                                <button
                                                                    onClick={() => setBodyViewMode('tree')}
                                                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${bodyViewMode === 'tree' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                    title="Tree View"
                                                                >
                                                                    <Braces className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setBodyViewMode('raw')}
                                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${bodyViewMode === 'raw' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                                title="Raw Text"
                                                            >
                                                                <AlignLeft className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-4 overflow-x-auto min-h-[100px] max-h-[500px] custom-scrollbar">
                                                        {bodyViewMode === 'pretty' && isJsonBody ? (
                                                            <SyntaxHighlightedJson json={responseBodyContent} />
                                                        ) : bodyViewMode === 'tree' && isJsonBody ? (
                                                            <div className="pl-1">
                                                                <JsonTree data={responseBodyContent} />
                                                            </div>
                                                        ) : (
                                                            <pre className="text-xs font-mono whitespace-pre-wrap text-slate-300">
                                                                {typeof responseBodyContent === 'string' ? responseBodyContent : JSON.stringify(responseBodyContent, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State (Desktop only) */}
                        {!selectedId && requests.length > 0 && (
                            <div className="hidden md:flex w-[60%] flex-col items-center justify-center text-slate-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#020617]">
                                <div className="text-center p-8 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                                    <ArrowDownLeft className="w-10 h-10 mx-auto mb-4 text-slate-600" />
                                    <h3 className="text-slate-400 font-medium mb-1">Select a Request</h3>
                                    <p className="text-slate-600 text-xs">View headers, payload, or WebSocket stream</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
