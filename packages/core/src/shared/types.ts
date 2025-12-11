export type LogLevel = "log" | "info" | "warn" | "error" | "debug" | "trace";
export type LogTriggerLevel = "log" | "warn" | "error";

export interface LogEvent {
  namespace: string;
  level: LogLevel;
  payload: unknown;
}

export interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RRWebConfig {
  maskAllInputs?: boolean;
  recordCanvas?: boolean;
  blockClass?: string;
  ignoreClass?: string;
  maskTextClass?: string;
}

export interface TrackerFeatures {
  console: boolean;
  network: boolean;
  dom: boolean;
  rrweb: boolean;
  autoError: boolean;
  manual: boolean;
  consoleAutoReport: boolean;
}

export interface FeatureFlags {
  captureNetwork?: boolean;
  captureRrweb?: boolean;
}

export interface TrackerConfig {
  features: TrackerFeatures;
  consoleReportTriggers?: LogTriggerLevel[];
  logRetentionMinutes?: number;
  reportEndpoint?: string;
  rrwebConfig?: RRWebConfig;
  user?: UserInfo;
  featureFlags?: FeatureFlags;
}

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  method: LogLevel;
  args: unknown[];
  stack?: string;
  origin: "console" | "runtimeError" | "unhandledRejection";
}

export interface DomEventLogEntry {
  id: string;
  timestamp: string;
  event: string;
  target: string;
  text: string;
  origin: "dom";
}

export interface HttpLogEntry {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  error?: string;
  origin: "fetch" | "xhr" | "network";
}

export interface RrwebLogEntry {
  id: string;
  timestamp: string;
  event: unknown;
  origin: "rrweb";
}

export interface SessionReport {
  sessionId: string;
  createdAt: string;
  trigger: string;
  featureFlags: FeatureFlags;
  user?: UserInfo;
  console: ConsoleLogEntry[];
  network: HttpLogEntry[];
  dom: DomEventLogEntry[];
  rrweb: RrwebLogEntry[];
}
