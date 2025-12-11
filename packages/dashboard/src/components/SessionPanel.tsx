
import React, { useRef, useEffect, useState } from "react";
import rrwebPlayer from "rrweb-player";
import { DOMEvent, ConsoleLog } from "../types";
import { PlayCircle, Film, AlertTriangle, Activity, Terminal, ChevronUp, ChevronDown, ChevronRight, Info, AlertCircle, MousePointer2, Clock, Bot } from "lucide-react";
import { Timeline } from "./Timeline";
import { PlayerControls } from "./PlayerControls";

interface Props {
    events: DOMEvent[];
    rrwebEvents: any[];
    consoleLogs: ConsoleLog[];
    sessionId: string;
    fetchRrwebEvents?: (sessionId: string) => Promise<any[]>;
}


// ... LogValue helper component ...
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

            // Create a short preview
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
                <span className="text-slate-400 font-mono text-[10px] break-all">
                    <span className="text-purple-400 italic mr-1">{label}</span>
                    <span className="opacity-70">{preview}</span>
                </span>
            );
        }

        // Long string preview
        return (
            <span className="text-slate-300 break-words">
                {stringValue.slice(0, 100)}
                <span className="text-slate-500 bg-slate-800/50 px-1 rounded ml-1 text-[9px] cursor-pointer hover:text-blue-400 whitespace-nowrap">...show more</span>
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
                        {isObject ? (
                            <div className="text-slate-300 font-mono text-[10px] bg-[#0b1120] p-2 rounded border border-slate-800/50 mt-1 overflow-x-auto">
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

export const SessionPanel: React.FC<Props> = ({ events, rrwebEvents, consoleLogs, sessionId, fetchRrwebEvents }) => {
    const [actualRrwebEvents, setActualRrwebEvents] = useState<any[]>(rrwebEvents || []);
    const [rrwebLoading, setRrwebLoading] = useState(false);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const isDestroyedRef = useRef(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [mobileActiveTab, setMobileActiveTab] = useState<'console' | 'events'>('console');

    // Poll player time for synchronization
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current) {
                const replayer = playerRef.current.getReplayer?.() || playerRef.current.replayer;
                if (replayer) {
                    const time = replayer.getCurrentTime();
                    setCurrentTime(time);
                }
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Use provided rrweb events
    useEffect(() => {
        setActualRrwebEvents(rrwebEvents || []);
    }, [rrwebEvents]);

    // Initialize Player
    useEffect(() => {
        if (!actualRrwebEvents?.length || !playerContainerRef.current) {
            return;
        }

        // Clean up previous player
        if (playerRef.current && !isDestroyedRef.current) {
            try {
                isDestroyedRef.current = true;
                if (playerRef.current.replayer) {
                    playerRef.current.replayer.destroy();
                }
                playerRef.current.$destroy?.();
            } catch {
                // Player destroy hataları görmezden gelinir - cleanup işlemi
            }
            playerRef.current = null;
        }
        isDestroyedRef.current = false;

        try {
            // Process events
            const events = actualRrwebEvents
                .map((e: any) => e.event || e)
                .filter((e: any) => e?.type !== undefined && e?.timestamp !== undefined)
                .sort((a: any, b: any) => a.timestamp - b.timestamp);

            if (events.length < 2) {
                setHasError(false);
                return;
            }

            // Check for required snapshot
            if (!events.some((e: any) => e.type === 2)) {
                setHasError(true);
                return;
            }

            setSessionStartTime(events[0].timestamp);

            // Create player
            // Mobile logic: Ensure width is correct for container
            const containerRect = playerContainerRef.current.getBoundingClientRect();

            const player = new rrwebPlayer({
                target: playerContainerRef.current,
                props: {
                    events,
                    width: containerRect.width,
                    height: containerRect.height,
                    autoPlay: false,
                    showController: false,
                    UNSAFE_replayCanvas: true,
                },
            });

            playerRef.current = player;

            // Handle Resize
            const resizeHandler = () => {
                if (playerRef.current && playerContainerRef.current) {
                    const rect = playerContainerRef.current.getBoundingClientRect();
                    // Trigger a resize on replayer if supported, or rely on CSS scaling
                    // rrweb-player isn't perfectly responsive by default, but we set width/height on init
                }
            }
            window.addEventListener('resize', resizeHandler);

            // Wait for replayer and add listeners
            const checkReplayer = () => {
                if (isDestroyedRef.current) return;
                const replayer = player.getReplayer?.();
                if (replayer) {
                    replayer.on("start", () => !isDestroyedRef.current && setIsPlaying(true));
                    replayer.on("pause", () => !isDestroyedRef.current && setIsPlaying(false));
                    replayer.on("finish", () => !isDestroyedRef.current && setIsPlaying(false));
                    setIsPlaying(false);
                } else {
                    setTimeout(checkReplayer, 100);
                }
            };
            checkReplayer();

            setHasError(false);
            return () => {
                window.removeEventListener('resize', resizeHandler);
            }
        } catch (e) {
            console.error("Player init failed:", e);
            setHasError(true);
        }

        return () => {
            isDestroyedRef.current = true;
            if (playerRef.current) {
                try {
                    if (playerRef.current.replayer) {
                        playerRef.current.replayer.destroy();
                    }
                    playerRef.current.$destroy?.();
                } catch {
                    // Player destroy hataları görmezden gelinir - cleanup işlemi
                }
                playerRef.current = null;
            }
        };
    }, [actualRrwebEvents]);

    // Filter logs based on current playback time
    const visibleLogs = consoleLogs.filter(log => {
        if (!sessionStartTime) return true;
        const logTime = new Date(log.timestamp).getTime();
        const relativeTime = logTime - sessionStartTime;
        return relativeTime <= currentTime + 5000;
    });

    const infoCount = visibleLogs.filter(l => l.method === 'log' || l.method === 'info').length;
    const warnCount = visibleLogs.filter(l => l.method === 'warn').length;
    const errorCount = visibleLogs.filter(l => l.method === 'error').length;

    // Auto-scroll console
    useEffect(() => {
        if (isConsoleOpen && consoleEndRef.current && mobileActiveTab === 'console') {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [visibleLogs.length, isConsoleOpen, mobileActiveTab]);

    const getLogIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
            case 'warn': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
            default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
        }
    };

    const getLogStyles = (method: string) => {
        switch (method.toLowerCase()) {
            case 'error': return 'bg-red-500/5 border-l-red-500/50 hover:bg-red-500/10';
            case 'warn': return 'bg-amber-500/5 border-l-amber-500/50 hover:bg-amber-500/10';
            case 'info': return 'bg-blue-500/5 border-l-blue-500/50 hover:bg-blue-500/10';
            default: return 'bg-transparent border-l-transparent hover:bg-slate-800/30';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#020617]">
            {/* Header */}
            <div className="h-12 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                    <PlayCircle className="w-4 h-4 text-purple-400" /> Session Replay
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                    <span className="hidden sm:inline">{actualRrwebEvents.length} frames</span>
                    <span className="text-slate-700 hidden sm:inline">|</span>
                    <span>{events.length} events</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Timeline - Desktop Sidebar Only */}
                <div className="hidden md:flex order-1 md:w-72 border-r border-slate-800 overflow-hidden flex-col">
                    <div className="p-2 text-xs font-bold text-slate-500 bg-slate-900/50 border-b border-slate-800 uppercase">Event Timeline</div>
                    <div className="flex-1 overflow-y-auto">
                        <Timeline
                            events={events}
                            playerRef={playerRef}
                            sessionStartTime={sessionStartTime}
                            currentTime={currentTime}
                        />
                    </div>
                </div>

                {/* Player Area */}
                <div className="flex-1 bg-[#020617] flex flex-col relative overflow-hidden order-2">
                    <div className="w-full h-full flex flex-col overflow-hidden relative group">

                        {/* Player Container */}
                        <div className="flex-1 relative bg-black/20 overflow-hidden flex flex-col">
                            {rrwebLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col">
                                    <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin mb-4" />
                                    <span className="text-sm">Loading session replay...</span>
                                </div>
                            ) : !actualRrwebEvents?.length ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col">
                                    <Film className="w-12 h-12 opacity-20 mb-2" />
                                    <span className="text-sm">No recording data available</span>
                                </div>
                            ) : (
                                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900">
                                    {/* Wrapper to center and contain the player */}
                                    <div className="w-full h-full relative" ref={playerContainerRef} />
                                </div>
                            )}

                            {/* Collapsible Bottom Drawer (Console + Mobile Timeline) */}
                            <div className={`
                 border-t border-slate-800 bg-[#0f172a] absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out flex flex-col shadow-2xl
                 ${isConsoleOpen ? 'h-[60%] md:h-[40%]' : 'h-9'}
              `}>
                                {/* Drawer Header / Tab Bar */}
                                <div className="h-9 bg-slate-900/90 hover:bg-slate-800 border-b border-slate-800 flex items-center justify-between px-0 text-xs font-medium text-slate-300 transition-colors w-full backdrop-blur-sm">
                                    <div className="flex items-center h-full">
                                        {/* Mobile Tabs */}
                                        <div className="md:hidden flex h-full">
                                            <button
                                                onClick={() => { setMobileActiveTab('console'); setIsConsoleOpen(true); }}
                                                className={`px-4 h-full flex items-center gap-2 transition-colors border-r border-slate-800 ${mobileActiveTab === 'console' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                <Terminal className="w-3.5 h-3.5" />
                                                <span className="font-semibold tracking-wide">CONSOLE</span>
                                            </button>
                                            <button
                                                onClick={() => { setMobileActiveTab('events'); setIsConsoleOpen(true); }}
                                                className={`px-4 h-full flex items-center gap-2 transition-colors border-r border-slate-800 ${mobileActiveTab === 'events' ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                <Activity className="w-3.5 h-3.5" />
                                                <span className="font-semibold tracking-wide">EVENTS</span>
                                            </button>
                                        </div>

                                        {/* Desktop Title */}
                                        <div
                                            className="hidden md:flex items-center gap-4 px-4 h-full cursor-pointer w-full"
                                            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                                        >
                                            <div className="flex items-center gap-2 text-slate-200">
                                                <Terminal className="w-3.5 h-3.5" />
                                                <span className="font-semibold tracking-wide">CONSOLE</span>
                                                {consoleLogs.length > 0 && (
                                                    <span className="text-[10px] text-slate-500 font-mono">({consoleLogs.length})</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${errorCount > 0
                                                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-500'
                                                    }`}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="font-mono">{errorCount}</span>
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${warnCount > 0
                                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-500'
                                                    }`}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="font-mono">{warnCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toggle Button */}
                                    <button
                                        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                                        className="px-4 h-full flex items-center justify-center text-slate-500 hover:text-white"
                                    >
                                        {isConsoleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                    </button>
                                </div>

                                {isConsoleOpen && (
                                    <div className="flex-1 overflow-hidden bg-[#020617] relative">
                                        {/* Console Content */}
                                        <div className={`absolute inset-0 overflow-y-auto p-2 md:p-0 font-mono text-[11px] custom-scrollbar ${mobileActiveTab === 'events' ? 'md:block hidden' : 'block'}`}>
                                            {consoleLogs.length === 0 ? (
                                                <div className="text-slate-700 p-4 text-center">
                                                    <div className="mb-2 italic">No console logs captured in this session</div>
                                                </div>
                                            ) : visibleLogs.length === 0 ? (
                                                <div className="text-slate-600 p-4 text-center">
                                                    <div className="mb-2">No logs at current time</div>
                                                </div>
                                            ) : (
                                                visibleLogs.map((log) => (
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
                                            transition-colors
                                            ${getLogStyles(log.method)}
                                        `}
                                                    >
                                                        {/* Mobile Header */}
                                                        <div className="flex md:hidden items-center justify-between pb-1 border-b border-slate-800/30 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                {getLogIcon(log.method)}
                                                                <span className={`text-[10px] font-bold uppercase ${log.method === 'error' ? 'text-red-400' : 'text-slate-400'
                                                                    }`}>{log.method}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                                                            </div>
                                                        </div>

                                                        {/* Desktop: Icon */}
                                                        <div className="hidden md:flex mt-0.5 opacity-80 shrink-0 w-6 justify-center">{getLogIcon(log.method)}</div>

                                                        {/* Desktop: Time */}
                                                        <div className="hidden md:block text-slate-500 pt-0.5 shrink-0 w-[85px] text-[11px] font-sans">
                                                            {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex flex-wrap items-start leading-relaxed">
                                                                {log.args.map((arg, i) => (
                                                                    <LogValue key={i} value={arg} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <div ref={consoleEndRef} />
                                        </div>

                                        {/* Mobile Timeline Content */}
                                        <div className={`absolute inset-0 overflow-hidden md:hidden ${mobileActiveTab === 'events' ? 'block' : 'hidden'}`}>
                                            <Timeline
                                                events={events}
                                                playerRef={playerRef}
                                                sessionStartTime={sessionStartTime}
                                                currentTime={currentTime}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error State */}
                            {hasError && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                                    <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-2xl max-w-sm">
                                        <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-xl font-bold text-slate-200">
                                                Playback Failed
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Invalid recording data
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!hasError && !rrwebLoading && actualRrwebEvents?.length > 0 && (
                            <PlayerControls playerRef={playerRef} isConsoleOpen={isConsoleOpen} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
