
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Plus, Trash2, Wifi, Zap, Globe, Clock, Database, FileJson, AlignLeft, ChevronDown, Check, X, Activity, RotateCw, Server, Settings, MessageSquare, Radio, Copy, Code, Braces, ChevronRight, Search } from 'lucide-react';
// @ts-ignore
import { io, Socket } from 'socket.io-client';
// @ts-ignore
import * as signalR from '@microsoft/signalr';

export interface SimulationPreset {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
}

interface Props {
    prefillData?: SimulationPreset | null;
}

// ... Shared Components (HighlightedText, JsonPrimitive, JsonTree, SyntaxHighlightedJson) remain unchanged ...
const HighlightedText: React.FC<{ text: string; highlight: string; className?: string }> = ({ text, highlight, className = '' }) => {
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>;
    }
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    const parts = text.split(regex);
    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded-[1px] px-[1px]">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const JsonPrimitive: React.FC<{ value: any; highlight?: string }> = ({ value, highlight = '' }) => {
    if (value === null) return <span className="text-slate-500">null</span>;
    if (value === undefined) return <span className="text-slate-600">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-red-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-orange-400">{value}</span>;
    const strValue = String(value);
    if (typeof value === 'string') {
        return (
            <span className="text-green-400">
                "<HighlightedText text={strValue} highlight={highlight} className="text-green-400" />"
            </span>
        );
    }
    return <HighlightedText text={strValue} highlight={highlight} className="text-slate-300" />;
};

const JsonTree: React.FC<{ data: any; name?: string; isLast?: boolean; depth?: number; highlight?: string }> = ({ data, name, isLast, depth = 0, highlight = '' }) => {
    const [expanded, setExpanded] = useState(depth < 1);
    useEffect(() => {
        if (highlight && depth < 3) setExpanded(true);
    }, [highlight, depth]);

    if (typeof data !== 'object' || data === null) {
        return (
            <div className="font-mono text-xs leading-5 hover:bg-white/5 px-1 rounded flex items-center">
                {name && (
                    <span className="text-blue-300 mr-1">
                        <HighlightedText text={name} highlight={highlight} />:
                    </span>
                )}
                <JsonPrimitive value={data} highlight={highlight} />
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
                {name && (
                    <span className="text-blue-300 mr-1">
                        <HighlightedText text={name} highlight={highlight} />:
                    </span>
                )}
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
                {name && (
                    <span className="text-blue-300 mr-1 group-hover:text-blue-200">
                        <HighlightedText text={name} highlight={highlight} />:
                    </span>
                )}
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
                            highlight={highlight}
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

const SyntaxHighlightedJson: React.FC<{ json: any; highlight?: string }> = ({ json, highlight = '' }) => {
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
                return (
                    <span key={i} className={colorClass}>
                        <HighlightedText text={token} highlight={highlight} />
                    </span>
                );
            })}
        </div>
    );
};

// --- Main Panel Component ---

export const SimulatorPanel: React.FC<Props> = ({ prefillData }) => {
    const [activeTab, setActiveTab] = useState<'http' | 'ws'>('http');

    useEffect(() => {
        if (prefillData) {
            if (prefillData.url.startsWith('ws://') || prefillData.url.startsWith('wss://')) {
                setActiveTab('ws');
            } else {
                setActiveTab('http');
            }
        }
    }, [prefillData]);

    return (
        <div className="flex flex-col h-full bg-[#020617] text-slate-200">
            <div className="border-b border-slate-800 bg-[#0f172a]/50 p-2 flex gap-2 sm:gap-4 backdrop-blur-sm shrink-0 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('http')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${activeTab === 'http' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Globe className="w-4 h-4" /> HTTP Request
                </button>
                <button
                    onClick={() => setActiveTab('ws')}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${activeTab === 'ws' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Zap className="w-4 h-4" /> Realtime / WS
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'http' ?
                    <HttpSimulator prefillData={prefillData} /> :
                    <WebSocketSimulator prefillData={prefillData} />
                }
            </div>
        </div>
    );
};

// --- HTTP Simulator Components ---

type KeyValue = { id: string; key: string; value: string; active: boolean };
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

const HttpSimulator: React.FC<{ prefillData?: SimulationPreset | null }> = ({ prefillData }) => {
    const [method, setMethod] = useState<Method>('GET');
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
    const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body'>('params');
    const [mobileTab, setMobileTab] = useState<'request' | 'response'>('request');

    // Request Data
    const [queryParams, setQueryParams] = useState<KeyValue[]>([{ id: '1', key: '', value: '', active: true }]);
    const [headers, setHeaders] = useState<KeyValue[]>([
        { id: '1', key: 'Content-Type', value: 'application/json', active: true },
        { id: '2', key: 'Accept', value: '*/*', active: true }
    ]);
    const [bodyType, setBodyType] = useState<'json' | 'text'>('json');
    const [bodyContent, setBodyContent] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');

    // Response Data
    const [loading, setLoading] = useState(false);
    const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
    const [viewMode, setViewMode] = useState<'pretty' | 'tree' | 'raw'>('pretty');
    const [responseSearch, setResponseSearch] = useState('');
    const [response, setResponse] = useState<{
        status: number;
        statusText: string;
        time: number;
        size: number;
        data: string;
        headers: Record<string, string>;
    } | null>(null);

    // ... (useEffect for prefill, updateParamsFromUrl, etc. kept same) ...
    useEffect(() => {
        if (prefillData && !prefillData.url.startsWith('ws')) {
            const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
            const upperMethod = prefillData.method.toUpperCase();
            if (validMethods.includes(upperMethod)) setMethod(upperMethod as Method);
            setUrl(prefillData.url);
            updateParamsFromUrl(prefillData.url);
            if (prefillData.headers) {
                const newHeaders: KeyValue[] = Object.entries(prefillData.headers).map(([key, value]) => ({
                    id: Math.random().toString(36).substr(2, 9), key, value: String(value), active: true
                }));
                newHeaders.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
                setHeaders(newHeaders);
            }
            if (prefillData.body) {
                if (typeof prefillData.body === 'object') {
                    setBodyContent(JSON.stringify(prefillData.body, null, 2));
                    setBodyType('json');
                } else {
                    setBodyContent(String(prefillData.body));
                    setBodyType('text');
                }
                if (!['GET', 'HEAD'].includes(upperMethod)) setRequestTab('body');
            }
        }
    }, [prefillData]);
    const updateParamsFromUrl = (newUrl: string) => {
        try {
            const urlObj = new URL(newUrl);
            const newParams: KeyValue[] = [];
            urlObj.searchParams.forEach((value, key) => newParams.push({ id: Math.random().toString(36).substr(2, 9), key, value, active: true }));
            newParams.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
            setQueryParams(newParams);
        } catch {
            // Geçersiz URL formatı - sessizce geç
        }
    };
    const updateUrlFromParams = (params: KeyValue[]) => {
        try {
            if (!url) return;
            const urlParts = url.split('?');
            const baseUrl = urlParts[0];
            const searchParams = new URLSearchParams();
            params.forEach(p => { if (p.active && p.key) searchParams.append(p.key, p.value); });
            const queryString = searchParams.toString();
            setUrl(queryString ? `${baseUrl}?${queryString}` : baseUrl);
        } catch {
            // URL güncelleme hatası - sessizce geç
        }
    };
    const handleParamChange = (id: string, field: 'key' | 'value' | 'active', value: any) => {
        const newParams = queryParams.map(p => p.id === id ? { ...p, [field]: value } : p);
        if (field !== 'active' && id === newParams[newParams.length - 1].id) newParams.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
        setQueryParams(newParams);
        updateUrlFromParams(newParams);
    };
    const handleParamDelete = (id: string) => {
        const newParams = queryParams.filter(p => p.id !== id);
        if (newParams.length === 0) newParams.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
        setQueryParams(newParams);
        updateUrlFromParams(newParams);
    };
    const handleHeaderChange = (id: string, field: 'key' | 'value' | 'active', value: any) => {
        const newHeaders = headers.map(h => h.id === id ? { ...h, [field]: value } : h);
        if (field !== 'active' && id === newHeaders[newHeaders.length - 1].id) newHeaders.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
        setHeaders(newHeaders);
    };
    const handleHeaderDelete = (id: string) => {
        const newHeaders = headers.filter(h => h.id !== id);
        if (newHeaders.length === 0) newHeaders.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', active: true });
        setHeaders(newHeaders);
    };

    const handleSend = async () => {
        setMobileTab('response');
        setLoading(true);
        setResponse(null);
        setResponseSearch('');
        const startTime = performance.now();
        try {
            const activeHeaders = headers.reduce((acc, curr) => { if (curr.active && curr.key) acc[curr.key] = curr.value; return acc; }, {} as Record<string, string>);
            const options: RequestInit = { method, headers: activeHeaders };
            if (['POST', 'PUT', 'PATCH'].includes(method)) options.body = bodyContent;
            const res = await fetch(url, options);
            const endTime = performance.now();
            const blob = await res.blob();
            const text = await blob.text();
            const size = blob.size;
            try { JSON.parse(text); } catch { }
            const resHeaders: Record<string, string> = {};
            res.headers.forEach((val, key) => resHeaders[key] = val);
            setResponse({ status: res.status, statusText: res.statusText, time: Math.round(endTime - startTime), size, data: text, headers: resHeaders });
        } catch (e: any) {
            setResponse({ status: 0, statusText: 'Network Error', time: Math.round(performance.now() - startTime), size: 0, data: e.message || 'Failed to fetch', headers: {} });
        } finally { setLoading(false); }
    };
    const getMethodColor = (m: Method) => {
        switch (m) { case 'GET': return 'text-blue-400'; case 'POST': return 'text-emerald-400'; case 'PUT': return 'text-amber-400'; case 'DELETE': return 'text-red-400'; default: return 'text-slate-400'; }
    };
    const getJsonData = () => {
        if (!response?.data) return null;
        try { return JSON.parse(response.data); } catch { return null; }
    };
    const jsonData = getJsonData();

    return (
        <div className="h-full flex flex-col">
            {/* Top Bar - Stacked on mobile */}
            <div className="p-4 border-b border-slate-800 bg-[#0f172a]/30 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
                <div className="flex-1 flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 h-10">
                    <div className="relative border-r border-slate-700 min-w-[80px] sm:min-w-[100px]">
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value as Method)}
                            className={`w-full h-full appearance-none bg-slate-900 px-3 py-2 text-sm font-bold focus:outline-none cursor-pointer ${getMethodColor(method)}`}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                            <option value="HEAD">HEAD</option>
                            <option value="OPTIONS">OPTIONS</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={e => {
                            setUrl(e.target.value);
                            updateParamsFromUrl(e.target.value);
                        }}
                        className="flex-1 bg-transparent px-4 py-2 text-sm font-mono text-slate-200 focus:outline-none placeholder-slate-600 w-full min-w-0"
                        placeholder="Enter URL"
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] h-10 shrink-0"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                </button>
            </div>

            {/* Mobile View Switcher */}
            <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/50 shrink-0">
                <button
                    onClick={() => setMobileTab('request')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'request' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Request Config
                </button>
                <button
                    onClick={() => setMobileTab('response')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'response' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Response
                    {response && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${response.status >= 200 && response.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {response.status}
                        </span>
                    )}
                </button>
            </div>

            {/* Split View - Tabbed on Mobile, Horizontal on Desktop */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

                {/* Request Config Column */}
                <div className={`
                    flex-1 lg:flex-[0.4] flex flex-col border-r border-slate-800 bg-[#020617]
                    ${mobileTab === 'request' ? 'flex' : 'hidden lg:flex'}
                `}>
                    <div className="flex items-center border-b border-slate-800 bg-slate-900/30 overflow-x-auto shrink-0">
                        <TabButton active={requestTab === 'params'} onClick={() => setRequestTab('params')}>Params</TabButton>
                        <TabButton active={requestTab === 'headers'} onClick={() => setRequestTab('headers')}>Headers <span className="ml-1 opacity-50 text-[10px]">({headers.filter(h => h.active && h.key).length})</span></TabButton>
                        <TabButton
                            active={requestTab === 'body'}
                            onClick={() => setRequestTab('body')}
                            disabled={['GET', 'HEAD'].includes(method)}
                            className={['GET', 'HEAD'].includes(method) ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            Body
                        </TabButton>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#020617] relative">
                        {requestTab === 'params' && (
                            <KeyValueEditor
                                title="Query Params"
                                items={queryParams}
                                onChange={handleParamChange}
                                onDelete={handleParamDelete}
                            />
                        )}
                        {requestTab === 'headers' && (
                            <KeyValueEditor
                                title="Request Headers"
                                items={headers}
                                onChange={handleHeaderChange}
                                onDelete={handleHeaderDelete}
                            />
                        )}
                        {requestTab === 'body' && (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-4 p-2 border-b border-slate-800 bg-slate-900/20 text-xs shrink-0">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={bodyType === 'json'} onChange={() => setBodyType('json')} className="accent-blue-500" />
                                        <span className="text-slate-300">Raw JSON</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={bodyType === 'text'} onChange={() => setBodyType('text')} className="accent-blue-500" />
                                        <span className="text-slate-300">Text</span>
                                    </label>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={bodyContent}
                                        onChange={e => setBodyContent(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-transparent p-4 text-xs font-mono text-slate-300 focus:outline-none resize-none"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        )}
                        {requestTab === 'body' && ['GET', 'HEAD'].includes(method) && (
                            <div className="absolute inset-0 bg-[#020617]/90 flex flex-col items-center justify-center text-slate-500 z-10">
                                <p className="text-sm">No body for {method}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Response View Column */}
                <div className={`
                    flex-1 flex flex-col min-w-0 bg-[#0b1120]
                    ${mobileTab === 'response' ? 'flex' : 'hidden lg:flex'}
                `}>
                    {/* Response Header Status Bar */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between h-[50px] shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response</span>
                        {response ? (
                            <div className="flex items-center gap-3 text-xs">
                                <div className={`px-2 py-1 rounded font-bold text-[10px] tracking-wide ${response.status >= 200 && response.status < 300 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {response.status}
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                                    <Clock className="w-3 h-3 text-blue-400" /> {response.time}ms
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-600 italic">No request sent</div>
                        )}
                    </div>

                    {response ? (
                        <>
                            {/* Response Tabs & Toolbar */}
                            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/20 px-2 h-10 shrink-0">
                                <div className="flex h-full">
                                    <button onClick={() => setResponseTab('body')} className={`px-3 md:px-4 h-full text-xs font-medium border-b-2 transition-colors ${responseTab === 'body' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500'}`}>Body</button>
                                    <button onClick={() => setResponseTab('headers')} className={`px-3 md:px-4 h-full text-xs font-medium border-b-2 transition-colors ${responseTab === 'headers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500'}`}>Headers</button>
                                </div>
                                <div className="flex items-center gap-2 h-full py-1.5">
                                    <div className="relative group flex items-center bg-slate-950/50 border border-slate-700/50 rounded-md">
                                        <input type="text" placeholder="Find..." value={responseSearch} onChange={e => setResponseSearch(e.target.value)} className="w-16 sm:w-24 bg-transparent border-none text-[10px] text-slate-200 focus:ring-0 py-1 px-2" />
                                    </div>
                                    {responseTab === 'body' && (
                                        <div className="flex bg-slate-950 rounded border border-slate-800 overflow-hidden">
                                            <button onClick={() => setViewMode('pretty')} className={`p-1.5 ${viewMode === 'pretty' ? 'text-blue-400 bg-slate-800' : 'text-slate-500'}`}><Code className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setViewMode('tree')} className={`p-1.5 ${viewMode === 'tree' ? 'text-purple-400 bg-slate-800' : 'text-slate-500'}`}><Braces className="w-3.5 h-3.5" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Response Content */}
                            <div className="flex-1 overflow-y-auto p-0 bg-[#020617] relative custom-scrollbar">
                                {responseTab === 'body' && (
                                    <div className="absolute inset-0 p-4">
                                        {viewMode === 'pretty' && jsonData ? (
                                            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-4 min-h-full"><SyntaxHighlightedJson json={jsonData} highlight={responseSearch} /></div>
                                        ) : viewMode === 'tree' && jsonData ? (
                                            <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-4 min-h-full pl-2"><JsonTree data={jsonData} highlight={responseSearch} /></div>
                                        ) : (
                                            <div className="w-full h-full bg-[#0b1120] border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-300 overflow-auto whitespace-pre-wrap"><HighlightedText text={response.data} highlight={responseSearch} /></div>
                                        )}
                                    </div>
                                )}
                                {responseTab === 'headers' && (
                                    <div className="p-4">
                                        <div className="bg-[#0b1120] border border-slate-800 rounded-lg overflow-hidden">
                                            {Object.entries(response.headers).map(([k, v]) => (
                                                <div key={k} className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-slate-800/50 last:border-0 text-xs hover:bg-slate-800/30">
                                                    <div className="col-span-1 font-mono text-slate-400 break-all"><HighlightedText text={k} highlight={responseSearch} /></div>
                                                    <div className="col-span-2 font-mono text-slate-200 break-all"><HighlightedText text={v} highlight={responseSearch} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                            <Globe className="w-10 h-10 mb-2 stroke-[1]" />
                            <p className="text-sm">Ready to send</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KeyValueEditor: React.FC<{
    title: string,
    items: KeyValue[],
    onChange: (id: string, field: 'key' | 'value' | 'active', value: any) => void,
    onDelete: (id: string) => void
}> = ({ title, items, onChange, onDelete }) => {
    return (
        <div className="flex flex-col min-h-full">
            <div className="px-4 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-900/20 border-b border-slate-800/50 flex shrink-0">
                <div className="w-8 text-center">On</div>
                <div className="flex-1">Key</div>
                <div className="flex-1">Value</div>
                <div className="w-8"></div>
            </div>
            <div className="flex-1 p-2 space-y-1">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                        <div className="w-8 flex justify-center shrink-0">
                            <input type="checkbox" checked={item.active} onChange={e => onChange(item.id, 'active', e.target.checked)} className="rounded border-slate-700 bg-slate-900/50 w-3.5 h-3.5" />
                        </div>
                        <input type="text" placeholder="Key" value={item.key} onChange={e => onChange(item.id, 'key', e.target.value)} className="flex-1 bg-transparent border-b border-slate-800 focus:border-blue-500 px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-mono min-w-0" />
                        <input type="text" placeholder="Value" value={item.value} onChange={e => onChange(item.id, 'value', e.target.value)} className="flex-1 bg-transparent border-b border-slate-800 focus:border-blue-500 px-2 py-1.5 text-xs text-blue-300 focus:outline-none font-mono min-w-0" />
                        <button onClick={() => onDelete(item.id)} className="w-8 flex justify-center text-slate-700 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode, disabled?: boolean, className?: string }> = ({ active, onClick, children, disabled, className = '' }) => (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${active ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'} ${className}`}>{children}</button>
);

// --- WebSocket & Real-time Simulator (Mobile Adaptation) ---

type Protocol = 'WS' | 'SOCKET_IO' | 'SIGNAL_R';
type LogType = 'sent' | 'recv' | 'sys' | 'error';
interface WSLog { id: string; type: LogType; msg: string; time: string; detail?: string }

const WebSocketSimulator: React.FC<{ prefillData?: SimulationPreset | null }> = ({ prefillData }) => {
    // ... (State logic same as before) ...
    const [protocol, setProtocol] = useState<Protocol>('WS');
    const [url, setUrl] = useState('wss://echo.websocket.org');
    const [socketEvent, setSocketEvent] = useState('message');
    const [signalRHub, setSignalRHub] = useState('chatHub');
    const [signalRMethod, setSignalRMethod] = useState('SendMessage');
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [message, setMessage] = useState('');
    const [logs, setLogs] = useState<WSLog[]>([]);
    const [logSearch, setLogSearch] = useState('');
    const [mobileTab, setMobileTab] = useState<'config' | 'logs'>('config');

    const wsRef = useRef<WebSocket | null>(null);
    const socketIoRef = useRef<Socket | null>(null);
    const signalRRef = useRef<signalR.HubConnection | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const filteredLogs = useMemo(() => {
        if (!logSearch) return logs;
        const term = logSearch.toLowerCase();
        return logs.filter(l => l.msg.toLowerCase().includes(term) || (l.detail && l.detail.toLowerCase().includes(term)) || l.type.includes(term));
    }, [logs, logSearch]);

    // ... (useEffect, addLog, handleConnect, handleSend, tryParseJson same as before) ...
    useEffect(() => {
        if (prefillData && (prefillData.url.startsWith('ws') || prefillData.url.includes('socket') || prefillData.url.includes('hub'))) {
            setUrl(prefillData.url);
            let protocolSet = false;
            try {
                const parsed = new URL(prefillData.url);
                // Set as SOCKET_IO if path starts with /socket.io (the standard socket.io path)
                if (parsed.pathname.startsWith('/socket.io')) {
                    setProtocol('SOCKET_IO');
                    protocolSet = true;
                } else if (parsed.pathname.includes('hub') || parsed.pathname.toLowerCase().includes('signalr')) {
                    setProtocol('SIGNAL_R');
                    protocolSet = true;
                }
            } catch (e) {
                // fallback to substring matching if URL parsing fails (rare)
                if (prefillData.url.includes('socket.io')) {
                    setProtocol('SOCKET_IO');
                    protocolSet = true;
                } else if (prefillData.url.includes('hub') || prefillData.url.toLowerCase().includes('signalr')) {
                    setProtocol('SIGNAL_R');
                    protocolSet = true;
                }
            }
            if (!protocolSet) setProtocol('WS');
            if (prefillData.body) setMessage(typeof prefillData.body === 'object' ? JSON.stringify(prefillData.body) : String(prefillData.body));
        }
    }, [prefillData]);
    useEffect(() => { if (logContainerRef.current && !logSearch) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight; }, [logs, logSearch]);

    const addLog = (type: LogType, msg: string, detail?: string) => setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, msg, time: new Date().toLocaleTimeString(), detail }]);

    const handleConnect = async () => {
        if (isConnected) {
            // ... Disconnect logic
            if (wsRef.current) wsRef.current.close();
            if (socketIoRef.current) socketIoRef.current.disconnect();
            if (signalRRef.current) await signalRRef.current.stop();
            setStatus('disconnected'); setIsConnected(false); addLog('sys', `Disconnected from ${protocol} server`);
        } else {
            // ... Connect logic (simplified for brevity in this response but kept fully functional in file)
            setStatus('connecting'); addLog('sys', `Connecting to ${url}...`);
            // Switch to logs tab on mobile automatically when connecting
            setMobileTab('logs');
            try {
                if (protocol === 'WS') {
                    const ws = new WebSocket(url);
                    ws.onopen = () => { setStatus('connected'); setIsConnected(true); addLog('sys', 'Connection Established'); };
                    ws.onmessage = (e) => addLog('recv', e.data);
                    ws.onclose = () => { setStatus('disconnected'); setIsConnected(false); addLog('sys', 'Connection Closed'); };
                    ws.onerror = () => { setStatus('error'); addLog('error', 'Connection Error'); };
                    wsRef.current = ws;
                } else if (protocol === 'SOCKET_IO') {
                    const socket = io(url, { transports: ['websocket', 'polling'] });
                    socket.on('connect', () => { setStatus('connected'); setIsConnected(true); addLog('sys', `Socket.IO Connected`); });
                    socket.on('disconnect', (r: any) => { setStatus('disconnected'); setIsConnected(false); addLog('sys', `Disconnected: ${r}`); });
                    socket.onAny((ev: string, ...args: any[]) => addLog('recv', JSON.stringify(args), `Event: ${ev}`));
                    socketIoRef.current = socket;
                } else if (protocol === 'SIGNAL_R') {
                    let hubUrl = url;
                    if (signalRHub && signalRHub.trim() && !url.endsWith(signalRHub)) hubUrl = `${url.replace(/\/$/, '')}/${signalRHub.replace(/^\//, '')}`;
                    const connection = new signalR.HubConnectionBuilder().withUrl(hubUrl).withAutomaticReconnect().build();
                    connection.onclose(() => { setStatus('disconnected'); setIsConnected(false); addLog('sys', 'Disconnected'); });
                    if (signalRMethod) connection.on(signalRMethod, (...args: any[]) => addLog('recv', JSON.stringify(args), `Method: ${signalRMethod}`));
                    await connection.start();
                    setStatus('connected'); setIsConnected(true); addLog('sys', `SignalR Connected`);
                    signalRRef.current = connection;
                }
            } catch (e: any) { setStatus('error'); setIsConnected(false); addLog('error', `Connection Failed: ${e.message}`); }
        }
    };

    const handleSend = async () => {
        if (!message) return;
        if (protocol === 'SOCKET_IO') addLog('sent', JSON.stringify([socketEvent, tryParseJson(message)]));
        else if (protocol === 'SIGNAL_R') addLog('sent', JSON.stringify({ type: 1, target: signalRMethod, arguments: [tryParseJson(message)] }));
        else addLog('sent', message);

        try {
            if (protocol === 'WS' && wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(message);
            else if (protocol === 'SOCKET_IO' && socketIoRef.current?.connected) socketIoRef.current.emit(socketEvent, tryParseJson(message));
            else if (protocol === 'SIGNAL_R' && signalRRef.current?.state === signalR.HubConnectionState.Connected) {
                const jsonMsg = tryParseJson(message);
                await signalRRef.current.invoke(signalRMethod, ...(Array.isArray(jsonMsg) ? jsonMsg : [jsonMsg]));
            } else addLog('error', 'Cannot send: Not connected');
        } catch (e: any) { addLog('error', `Send Failed: ${e.message}`); }
        setMessage('');
    };

    const tryParseJson = (str: string) => { try { return JSON.parse(str); } catch { return str; } };

    return (
        <div className="flex flex-col lg:flex-row h-full relative">
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/50 shrink-0">
                <button
                    onClick={() => setMobileTab('config')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'config' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Configuration
                </button>
                <button
                    onClick={() => setMobileTab('logs')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === 'logs' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Live Logs
                    <span className={`ml-2 w-2 h-2 inline-block rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                </button>
            </div>

            {/* Sidebar Config - Mobile: Full Screen with Sticky Bottom Button */}
            <div className={`
                w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0f172a]/20 flex flex-col 
                ${mobileTab === 'config' ? 'flex h-full' : 'hidden lg:flex lg:h-full'}
                relative
            `}>
                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20 lg:pb-0">
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Protocol</h3>
                        <div className="grid grid-cols-3 lg:flex lg:flex-col gap-2">
                            <ProtocolOption active={protocol === 'WS'} onClick={() => setProtocol('WS')} label="WS" desc="Standard" icon={<Zap className="w-4 h-4" />} />
                            <ProtocolOption active={protocol === 'SOCKET_IO'} onClick={() => setProtocol('SOCKET_IO')} label="Socket.io" desc="v4" icon={<Activity className="w-4 h-4" />} />
                            <ProtocolOption active={protocol === 'SIGNAL_R'} onClick={() => setProtocol('SIGNAL_R')} label="SignalR" desc=".NET" icon={<Server className="w-4 h-4" />} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">Target URL</label>
                            <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-blue-300 font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                        {protocol === 'SOCKET_IO' && (
                            <div><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">Event Name</label><input type="text" value={socketEvent} onChange={e => setSocketEvent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-all" /></div>
                        )}
                        {protocol === 'SIGNAL_R' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">Hub Name</label><input type="text" value={signalRHub} onChange={e => setSignalRHub(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-all" /></div>
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">Method</label><input type="text" value={signalRMethod} onChange={e => setSignalRMethod(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-all" /></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer for Mobile (Connect Button) - Sits ABOVE bottom tabs */}
                <div className="lg:hidden fixed bottom-[60px] left-0 right-0 px-3 py-2 bg-[#020617]/95 border-t border-slate-800 z-40 backdrop-blur-sm">
                    <button
                        onClick={handleConnect}
                        className={`w-full py-3 rounded-lg text-sm font-bold uppercase shadow-lg transition-transform active:scale-95 ${isConnected ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-emerald-600 text-white shadow-emerald-900/20'}`}
                    >
                        {isConnected ? 'Disconnect Server' : 'Connect to Server'}
                    </button>
                </div>

                {/* Desktop Footer */}
                <div className="hidden lg:block p-4 border-t border-slate-800 mt-auto bg-slate-900/20">
                    <button onClick={handleConnect} className={`w-full py-2 rounded-lg text-xs font-bold uppercase ${isConnected ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}>{isConnected ? 'Disconnect' : 'Connect'}</button>
                </div>
            </div>

            {/* Main Content - Visible if tab is logs OR on desktop */}
            <div className={`
                flex-1 flex flex-col bg-[#0b1120] min-w-0 h-full overflow-hidden
                ${mobileTab === 'logs' ? 'flex' : 'hidden lg:flex'}
            `}>
                <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2 text-xs"><div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-slate-600'}`} /><span className="font-mono text-slate-400">{status}</span></div>
                    <button onClick={() => setLogs([])} className="p-1 hover:bg-slate-800 rounded"><Trash2 className="w-4 h-4 text-slate-500" /></button>
                </div>
                <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#020617] custom-scrollbar">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className={`flex ${log.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded px-3 py-2 text-xs font-mono border shadow-sm ${log.type === 'sent' ? 'bg-blue-900/10 border-blue-500/20 text-blue-200' : log.type === 'recv' ? 'bg-slate-800/80 border-slate-700 text-emerald-200' : log.type === 'error' ? 'bg-red-900/10 border-red-500/20 text-red-300' : 'bg-transparent border-transparent text-slate-500 w-full text-center italic text-[11px]'}`}>
                                <div className="whitespace-pre-wrap break-all">{log.msg}</div>
                            </div>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-30">
                            <MessageSquare className="w-12 h-12 mb-2" />
                            <p className="text-xs">No messages yet</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900/30 shrink-0">
                    <div className="relative">
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-12 text-xs font-mono text-slate-200 focus:outline-none resize-none h-12 focus:border-blue-500 transition-colors" />
                        <button onClick={handleSend} disabled={!message} className="absolute right-2 bottom-2 p-1.5 bg-blue-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProtocolOption: React.FC<{ active: boolean, onClick: () => void, label: string, desc: string, icon: React.ReactNode }> = ({ active, onClick, label, desc, icon }) => (
    <button onClick={onClick} className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:p-2 rounded-xl lg:rounded-lg transition-all border shrink-0 min-w-[80px] ${active ? 'bg-blue-600/10 border-blue-500/30 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800/50'}`}>
        <div className={`p-1.5 rounded-md shrink-0 hidden lg:block ${active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-600'}`}>{icon}</div>
        <div className="text-center lg:text-left">
            <div className={`text-xs font-bold ${active ? 'text-blue-200' : 'text-slate-400'}`}>{label}</div>
            <div className="text-[10px] opacity-60 font-mono hidden lg:block">{desc}</div>
        </div>
    </button>
);
