import { loggerService } from "../loggerService";
import { HttpLogEntry, LogLevel, FeatureFlags } from "../shared/types";
import { createId, nowIso, pruneByTime } from "../shared/utils";

// Hafif in-memory store; sadece son window tutulur.
const httpLogs: HttpLogEntry[] = [];
let retentionMs = 5 * 60 * 1000;
let featureFlags: FeatureFlags | undefined;

/**
 * Network capture'ı runtime'da aç/kapa; flag'ler scope'u belirler.
 */
export function configureNetworkLogger(flags: FeatureFlags) {
  featureFlags = flags;
}

/**
 * Network log retention süresini (dakika) günceller.
 */
export function setNetworkRetention(minutes: number) {
  retentionMs = Math.max(1, minutes) * 60 * 1000;
}

/**
 * Güncel network loglarını kopyalayarak döndürür.
 */
export function getHttpLogs(): HttpLogEntry[] {
  return [...httpLogs];
}

/**
 * Eski network kayıtlarını timestamp'e göre budar.
 */
export function cleanupNetworkLogs() {
  pruneByTime(httpLogs, retentionMs, "timestamp");
}

function record(entry: HttpLogEntry) {
  httpLogs.push(entry);
  loggerService.emit("network", entry.status >= 500 ? "error" : "info", entry);
}

/**
 * fetch API'sini wrap eder, her request için hafif telemetry yazar.
 */
function wrapFetch() {
  if (typeof fetch !== "function") return;
  const original = fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const start = performance.now();
    const requestId = createId();

    try {
      const response = await original(input, init);
      const duration = performance.now() - start;
      if (featureFlags?.captureNetwork === false) return response;

      const entry: HttpLogEntry = {
        id: requestId,
        timestamp: nowIso(),
        url: typeof input === "string" ? input : input.toString(),
        method: init?.method ?? "GET",
        status: response.status,
        duration,
        origin: "fetch",
      };
      record(entry);
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      if (featureFlags?.captureNetwork === false) throw error;
      const entry: HttpLogEntry = {
        id: requestId,
        timestamp: nowIso(),
        url: typeof input === "string" ? input : input.toString(),
        method: init?.method ?? "GET",
        status: 0,
        duration,
        error: (error as Error)?.message,
        origin: "fetch",
      };
      record(entry);
      throw error;
    }
  };
}

/**
 * XHR'ı wrap eder; legacy yolları da görünür kılar.
 */
function wrapXhr() {
  const NativeXHR = window.XMLHttpRequest;
  if (!NativeXHR) return;

  class PatchedXHR extends NativeXHR {
    private __url?: string;
    private __method?: string;
    private __start?: number;

    open(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
      this.__method = method;
      this.__url = typeof url === "string" ? url : url.toString();
      super.open(method, url as any, async ?? true, user ?? null, password ?? null);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null) {
      this.__start = performance.now();
      this.addEventListener("loadend", () => {
        const duration = this.__start !== undefined ? performance.now() - this.__start : 0;
        if (featureFlags?.captureNetwork === false) return;

        const entry: HttpLogEntry = {
          id: createId(),
          timestamp: nowIso(),
          url: this.__url ?? "UNKNOWN",
          method: this.__method ?? "GET",
          status: this.status,
          duration,
          origin: "xhr",
        };
        record(entry);
      });

      super.send(body as any);
    }
  }

  (window as any).XMLHttpRequest = PatchedXHR;
}

/**
 * Network logger'ı boot eder, fetch/XHR patch'lerini uygular, açılış logu düşer.
 */
export function initNetworkLogger(flags?: FeatureFlags) {
  if (typeof window === "undefined") return;
  featureFlags = flags;
  wrapFetch();
  wrapXhr();
  loggerService.emit("network", "info", {
    id: createId(),
    timestamp: nowIso(),
    url: "init",
    method: "INIT",
    status: 200,
    duration: 0,
    origin: "network",
  });
}
