import { loggerService } from "../loggerService";
import { triggerConsoleReport } from "../core/session";
import { ConsoleLogEntry, LogTriggerLevel, LogLevel } from "../shared/types";
import { createId, nowIso, pruneByTime } from "../shared/utils";

// Console events için küçük bir in-memory buffer tutuyoruz.
const consoleLogs: ConsoleLogEntry[] = [];
let triggers: LogTriggerLevel[] = [];
let retentionMs = 5 * 60 * 1000;

/**
 * Belirli level yakalandığında auto report tetikler.
 */
export function setConsoleAutoReportTriggers(next: LogTriggerLevel[]) {
  triggers = next;
}

/**
 * Console retention süresini (dakika) günceller.
 */
export function setConsoleRetention(minutes: number) {
  retentionMs = Math.max(1, minutes) * 60 * 1000;
}

/**
 * Güncel console loglarını kopyalayarak döndürür.
 */
export function getConsoleLogs(): ConsoleLogEntry[] {
  return [...consoleLogs];
}

/**
 * Retention penceresi dışındaki console loglarını temizler.
 */
export function cleanupConsoleLogs() {
  pruneByTime(consoleLogs, retentionMs, "timestamp");
}

/**
 * Stack trace yakalamaya çalışır; hata vermezse sessiz döner.
 */
function captureStack(): string | undefined {
  try {
    const err = new Error();
    if (!err.stack) return undefined;
    return err.stack.split("\n").slice(2).join("\n");
  } catch {
    return undefined;
  }
}

function record(entry: ConsoleLogEntry) {
  consoleLogs.push(entry);
  const level: LogLevel = entry.method === "warn" || entry.method === "error" ? entry.method : "log";
  loggerService.emit("console", level, entry);
}

/**
 * Belirli console method'unu wrap eder; hem kaydeder hem orijinale iletir.
 */
function handleMethod(method: LogLevel) {
  const original = (console as any)[method];
  if (typeof original !== "function") return;
  const originalFn = original.bind(console);

  (console as any)[method] = (...args: unknown[]) => {
    const entry: ConsoleLogEntry = {
      id: createId(),
      timestamp: nowIso(),
      method,
      args,
      stack: captureStack(),
      origin: "console",
    };

    record(entry);

    if (triggers.includes(method as LogTriggerLevel)) {
      setTimeout(() => triggerConsoleReport(), 50);
    }

    originalFn(...args);
  };
}

/**
 * Console patch'lerini uygular; runtime error ve visibility change dinler.
 */
export function initConsoleLogger() {
  if (typeof window === "undefined") return;

  (["log", "info", "warn", "error", "debug", "trace"] as LogLevel[]).forEach(
    (method) => handleMethod(method)
  );

  window.addEventListener("error", (event: ErrorEvent) => {
    const entry: ConsoleLogEntry = {
      id: createId(),
      timestamp: nowIso(),
      method: "error",
      args: [event.message, event.error],
      stack: event.error?.stack ?? captureStack(),
      origin: "runtimeError",
    };
    record(entry);
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const stack =
      (reason && typeof reason === "object" && "stack" in (reason as any) && (reason as any).stack) ||
      captureStack();

    const entry: ConsoleLogEntry = {
      id: createId(),
      timestamp: nowIso(),
      method: "error",
      args: ["Unhandled promise rejection", reason],
      stack,
      origin: "unhandledRejection",
    };

    record(entry);
  });

  window.addEventListener(
    "error",
    (event: Event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const entry: ConsoleLogEntry = {
          id: createId(),
          timestamp: nowIso(),
          method: "error",
          args: [`Kaynak yüklenemedi: ${target.tagName}`, target.outerHTML || target],
          origin: "runtimeError",
        };
        record(entry);
      }
    },
    true
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const entry: ConsoleLogEntry = {
        id: createId(),
        timestamp: nowIso(),
        method: "info",
        args: ["Sayfa gizlendi"],
        origin: "console",
      };
      record(entry);
    }
  });
}
