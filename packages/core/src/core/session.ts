import { loggerService } from "../loggerService";
import { getConsoleLogs, cleanupConsoleLogs } from "../logger/console";
import { getDomEvents } from "../logger/dom";
import { configureNetworkLogger, getHttpLogs, cleanupNetworkLogs } from "../logger/network";
import { configureRrwebLogger, getRrwebLogs, cleanupRrwebLogs, startRrwebRecorder } from "../logger/rrweb";
import { SessionReport, TrackerConfig, FeatureFlags, LogTriggerLevel, UserInfo } from "../shared/types";
import { createId, nowIso } from "../shared/utils";

let sessionId: string = createId();
let featureFlags: FeatureFlags = { captureNetwork: true, captureRrweb: true };
let userInfo: UserInfo | undefined;
let triggers: LogTriggerLevel[] = ["error", "warn"];
let reportEndpoint: string | undefined;

/**
 * Oturumu yapılandırır: feature'ları açar, rrweb/network setup yapar, triggers'ı ayarlar.
 */
export function configureSession(config: TrackerConfig) {
  featureFlags = config.featureFlags ?? featureFlags;
  configureNetworkLogger(featureFlags);
  configureRrwebLogger(featureFlags);
  triggers = config.consoleReportTriggers ?? triggers;
  userInfo = config.user;
  reportEndpoint = config.reportEndpoint;

  if (featureFlags.captureRrweb) {
    startRrwebRecorder();
  }
}

/** User info'yu aktif oturuma işler. */
export function setUser(info: UserInfo) {
  userInfo = info;
}

/** Harici sessionId'yi zorlar; multi-device senkron için. */
export function setSessionId(id: string) {
  sessionId = id;
}

/** Yeni bir sessionId üretir. */
export function regenerateSessionId() {
  sessionId = createId();
}

/** Aktif sessionId'yi döndürür. */
export function getSessionId() {
  return sessionId;
}

/** Console trigger dolunca raporu manuel ateşler. */
export function triggerConsoleReport() {
  if (!triggers.length) return;
  createSessionReport("consoleTrigger");
}

/**
 * Console, network, DOM, rrweb verilerini tek raporda toplar ve publish eder.
 */
export function createSessionReport(trigger: string): SessionReport {
  if (featureFlags.captureRrweb) {
    startRrwebRecorder();
  }

  cleanupConsoleLogs();
  cleanupNetworkLogs();
  cleanupRrwebLogs();

  const report: SessionReport = {
    sessionId,
    createdAt: nowIso(),
    trigger,
    featureFlags,
    user: userInfo,
    console: getConsoleLogs(),
    network: getHttpLogs(),
    dom: getDomEvents(),
    rrweb: getRrwebLogs(),
  };

  loggerService.emit("session", "info", report);

  // Backend'e raporu gönder
  if (reportEndpoint) {
    sendReportToBackend(report);
  }

  return report;
}

/**
 * Raporu backend API'ye POST eder.
 */
async function sendReportToBackend(report: SessionReport): Promise<void> {
  if (!reportEndpoint) return;

  try {
    const response = await fetch(reportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: report.sessionId,
        timestamp: report.createdAt,
        type: report.trigger,
        duration: 0,
        consoleLogs: report.console.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          method: log.method,
          args: log.args,
          stack: log.stack,
          origin: log.origin,
        })),
        networkLogs: report.network.map(net => ({
          id: net.id,
          timestamp: net.timestamp,
          source: net.origin,
          method: net.method,
          url: net.url,
          status: net.status,
          durationMs: net.duration,
        })),
        domEvents: report.dom.map(dom => ({
          id: dom.id,
          timestamp: dom.timestamp,
          type: dom.event,
          target: dom.target,
          data: { text: dom.text },
        })),
        rrwebEvents: report.rrweb.map(rr => rr.event),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        user: report.user,
      }),
    });

    if (!response.ok) {
      loggerService.emit('session', 'error', `Backend rapor hatası: ${response.status}`);
    }
  } catch (error) {
    loggerService.emit('session', 'error', `Backend bağlantı hatası: ${error}`);
  }
}

/** Aktif feature flag'lerini döndürür. */
export function getFeatureFlags(): FeatureFlags {
  return featureFlags;
}

/** Raporu tetikleyen console level listesini verir. */
export function getTriggers(): LogTriggerLevel[] {
  return triggers;
}
