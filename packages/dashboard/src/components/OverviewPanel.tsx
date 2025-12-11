import React from 'react';
import { SessionAnalytics } from '../types';
import { Activity, Globe, AlertTriangle, Zap, Clock, Server, ArrowUpRight, User } from 'lucide-react';

interface Props {
    analytics: SessionAnalytics;
}

export const OverviewPanel: React.FC<Props> = ({ analytics }) => {
    // Helper for time formatting
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatTimeShort = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

    const startTime = analytics.trafficVolume.length > 0 ? analytics.trafficVolume[0].timestamp : Date.now();
    const endTime = analytics.trafficVolume.length > 0 ? analytics.trafficVolume[analytics.trafficVolume.length - 1].timestamp : Date.now();

    return (
        <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto gap-4 md:gap-6">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Session Overview</h2>
                    <p className="text-slate-400 text-xs md:text-sm">Static snapshot of session telemetry</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono bg-slate-800/50 px-2 md:px-3 py-1 rounded-full border border-slate-700 text-slate-400 whitespace-nowrap">
                    SNAPSHOT VIEW
                </div>
            </div>

            {/* User Info (Conditional) */}
            {analytics.user && (
                <div className="glass rounded-xl p-4 border-l-4 border-l-purple-500 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50 shrink-0">
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-200 truncate">{analytics.user.name || 'Anonymous User'}</h3>
                            <p className="text-xs text-slate-500 font-mono truncate">{analytics.user.email || analytics.user.id}</p>
                        </div>
                    </div>
                    {analytics.userAgent && (
                        <div className="text-left sm:text-right w-full sm:w-auto">
                            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mb-1">Device / Agent</p>
                            <p className="text-xs text-slate-400 truncate max-w-full sm:max-w-xs" title={analytics.userAgent}>{analytics.userAgent}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Hero Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
                <MetricCard
                    title="Total Requests"
                    value={analytics.totalRequests.toString()}
                    icon={<Globe className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
                    trend="Recorded"
                    color="border-blue-500/20 bg-blue-500/5"
                />
                <MetricCard
                    title="Avg Latency"
                    value={`${analytics.avgLatency}ms`}
                    icon={<Clock className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />}
                    trend="Avg Response"
                    color="border-emerald-500/20 bg-emerald-500/5"
                />
                <MetricCard
                    title="Errors"
                    value={analytics.errorCount.toString()}
                    icon={<AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400" />}
                    trend={analytics.errorCount > 0 ? "Critical" : "Healthy"}
                    color="border-red-500/20 bg-red-500/5"
                />
                <MetricCard
                    title="DOM Events"
                    value={analytics.domEventCount.toString()}
                    icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />}
                    trend="User Interactions"
                    color="border-amber-500/20 bg-amber-500/5"
                />
            </div>

            {/* Charts Section */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 shrink-0">

                {/* Main Traffic Graph */}
                <div className="lg:col-span-2 glass rounded-xl p-4 md:p-5 flex flex-col relative overflow-hidden group min-h-[250px] md:min-h-[280px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 opacity-50" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 z-10 gap-2">
                        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" /> Traffic Volume
                        </h3>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                            {formatTime(startTime)} - {formatTime(endTime)}
                        </div>
                    </div>

                    {/* Graph Container */}
                    <div className="flex-1 flex flex-col relative z-10">
                        <div className="flex-1 flex items-end gap-1 justify-between px-1 md:px-2 pt-4">
                            {analytics.trafficVolume.map((bar, i) => {
                                const isTall = bar.height > 50;
                                const isStart = i < 3;
                                const isEnd = i > analytics.trafficVolume.length - 4;

                                // Dynamic Positioning Classes
                                let tooltipPosition = "";
                                let arrowPosition = "";

                                // Vertical Logic
                                if (isTall) {
                                    tooltipPosition += " top-2 ";
                                } else {
                                    tooltipPosition += " -top-12 ";
                                }

                                // Horizontal Logic
                                if (isStart) {
                                    tooltipPosition += " left-0 ";
                                    arrowPosition += " left-3 ";
                                } else if (isEnd) {
                                    tooltipPosition += " right-0 ";
                                    arrowPosition += " right-3 ";
                                } else {
                                    tooltipPosition += " left-1/2 -translate-x-1/2 ";
                                    arrowPosition += " left-1/2 -translate-x-1/2 ";
                                }

                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end group/bar h-full relative">
                                        {/* Bar - acts as relative parent for tooltip */}
                                        <div
                                            style={{ height: `${bar.height}%` }}
                                            className={`
                                    w-full rounded-t-sm relative transition-all duration-300 group/bar-inner min-w-[3px]
                                    ${bar.active
                                                    ? 'bg-gradient-to-t from-cyan-600 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] opacity-80 group-hover/bar:opacity-100'
                                                    : 'bg-slate-800/30'}
                                `}
                                        >
                                            {/* Tooltip */}
                                            <div className={`
                                    opacity-0 group-hover/bar:opacity-100 absolute ${tooltipPosition} 
                                    bg-slate-900 text-[10px] p-2 rounded border border-slate-700 
                                    whitespace-nowrap z-50 pointer-events-none transition-opacity shadow-xl 
                                    flex flex-col gap-0.5 min-w-[80px]
                                `}>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className={`font-bold ${isTall ? 'text-white' : 'text-cyan-400'}`}>
                                                        {bar.count} reqs
                                                    </span>
                                                    {isTall && <Activity className="w-3 h-3 text-cyan-400" />}
                                                </div>
                                                <span className={`font-mono text-[9px] ${isTall ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    {formatTime(bar.timestamp)}
                                                </span>

                                                {/* Arrow - Hide if inside bar (isTall) */}
                                                {!isTall && (
                                                    <div className={`absolute -bottom-1 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45 ${arrowPosition}`} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Time Axis */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500 font-mono">
                            <span>{formatTimeShort(startTime)}</span>
                            <span className="opacity-50 text-[9px]">TIMELINE</span>
                            <span>{formatTimeShort(endTime)}</span>
                        </div>
                    </div>

                    {/* Grid Lines */}
                    <div className="absolute inset-0 z-0 flex flex-col justify-between py-16 px-5 opacity-10 pointer-events-none">
                        <div className="w-full h-px bg-slate-400 dashed" />
                        <div className="w-full h-px bg-slate-400 dashed" />
                        <div className="w-full h-px bg-slate-400 dashed" />
                    </div>
                </div>

                {/* Method Distribution */}
                <div className="glass rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                        <Server className="w-4 h-4 text-purple-400" /> Request Methods
                    </h3>
                    <div className="flex-1 flex flex-col justify-center space-y-3">
                        {Object.keys(analytics.requestMethods).length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-slate-600 h-full py-8">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-xs">No Data Available</span>
                            </div>
                        ) : (
                            Object.entries(analytics.requestMethods).map(([method, count]: [string, number]) => (
                                <div key={method} className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span className="font-mono font-bold text-slate-300">{method}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${method === 'GET' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                method === 'POST' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    method === 'DELETE' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                }`}
                                            style={{ width: `${(count / analytics.totalRequests) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Errors Log */}
            <div className="glass rounded-xl p-5 flex flex-col shrink-0 min-h-[200px] mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> Recent Alerts
                    </h3>
                    {analytics.errorCount > 0 && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                            Action Required
                        </span>
                    )}
                </div>
                <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {analytics.recentAlerts.map(log => (
                        <div key={log.id} className="group flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all text-xs font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 w-min ${log.method === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {log.method}
                            </span>
                            <span className="text-slate-400 truncate flex-1 group-hover:text-slate-300 transition-colors w-full sm:w-auto">
                                {log.args.map(m => (typeof m === 'object' ? JSON.stringify(m) : String(m))).join(' ')}
                            </span>
                            <span className="text-slate-600 whitespace-nowrap text-[10px] sm:text-xs">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {analytics.recentAlerts.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-slate-600 text-xs py-12 bg-slate-900/20 rounded-lg border border-slate-800/50 border-dashed h-full">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                <Activity className="w-6 h-6 text-emerald-500/50" />
                            </div>
                            <span className="text-emerald-500/50 font-medium">System Healthy</span>
                            <span className="opacity-50 mt-1">No active warnings or errors detected</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string; color: string }> = ({ title, value, icon, trend, color }) => (
    <div className={`glass rounded-xl p-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${color}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
            <div className="p-1.5 rounded-lg bg-[#020617]/40 backdrop-blur-sm border border-white/5">{icon}</div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</span>
            <span className="text-[10px] font-medium opacity-70 flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3" /> {trend}
            </span>
        </div>
    </div>
);