/**
 * Console Types - Konsol log veri modelleri
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  LOG = 'log',
}

export interface ConsoleLog {
  id: string;
  timestamp: string | number;
  method: string;                  // log, warn, error, info, debug, etc.
  args: unknown[];                 // Log argümanları
  stack?: string;                  // Error stack trace
  origin?: string;                 // Kaynak dosya/satır
}
