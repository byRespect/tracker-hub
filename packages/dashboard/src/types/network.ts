/**
 * Network Types - HTTP/WS istek veri modelleri
 */

// WebSocket özel metadata
export interface WebSocketMeta {
  type: 'open' | 'message' | 'close' | 'error';
  direction?: 'incoming' | 'outgoing';
  messageSnippet?: string;
  sentCount?: number;
  receivedCount?: number;
}

// İstek başlatıcı bilgisi (stack trace)
export interface RequestInitiator {
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  functionName?: string;
}

// Network isteği metadata
export interface NetworkMeta {
  initiatorType?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  startTime?: number;
  url?: string;
  ws?: WebSocketMeta;
}

// Ana network log modeli
export interface NetworkLog {
  id: string;
  timestamp: string | number;
  source: 'fetch' | 'xhr' | 'websocket' | 'resource';
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  ok?: boolean;
  durationMs?: number;
  
  request?: {
    headers?: Record<string, string>;
    body?: unknown;
  };
  
  response?: {
    headers?: Record<string, string>;
    bodyTextSnippet?: string;
    body?: unknown;
  };
  
  meta?: NetworkMeta;
  initiator?: RequestInitiator;
}
