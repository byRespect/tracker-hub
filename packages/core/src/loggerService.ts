import { LogEvent, LogLevel } from "./shared/types";
import { Observable } from "./shared/observable";

type RawConsole = Partial<Record<LogLevel, (...args: unknown[]) => void>>;

const rawConsole: RawConsole = {};

(["log", "info", "warn", "error", "debug", "trace"] as LogLevel[]).forEach(
  (method) => {
    const fn = (console as any)[method];
    if (typeof fn === "function") rawConsole[method] = fn.bind(console);
  }
);

/**
 * Log verisini external sink'lere aktarmak için hafif interface.
 */
export interface LogSink {
  emit(namespace: string, level: LogLevel, payload: unknown): void;
}

class ConsoleSink implements LogSink {
  emit(namespace: string, level: LogLevel, payload: unknown) {
    const fn = rawConsole[level] ?? rawConsole.log;
    fn?.(`[${namespace.toUpperCase()}]`, payload);
  }
}

/**
 * Birden fazla sink'e publish eden basit log bus.
 */
class LoggerBus {
  private sinks = new Set<LogSink>();
  private stream = new Observable<LogEvent>();

  constructor() {
    this.sinks.add(new ConsoleSink());
  }

  use(sink: LogSink) {
    this.sinks.add(sink);
  }

  subscribe(observer: (event: LogEvent) => void): () => void {
    return this.stream.subscribe(observer);
  }

  emit(namespace: string, level: LogLevel, payload: unknown) {
    this.sinks.forEach((sink) => sink.emit(namespace, level, payload));
    this.stream.emit({ namespace, level, payload });
  }
}

export const loggerService = new LoggerBus();
