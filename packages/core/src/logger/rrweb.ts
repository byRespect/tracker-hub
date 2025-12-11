import { record } from "rrweb";
import { loggerService } from "../loggerService";
import { FeatureFlags, RrwebLogEntry } from "../shared/types";
import { createId, nowIso, pruneByTime } from "../shared/utils";

// Session replay event'leri için küçük bir in-memory window tutuyoruz.
const rrwebLogs: RrwebLogEntry[] = [];
let retentionMs = 5 * 60 * 1000;
let stopRecording: (() => void) | null = null;
let featureFlags: FeatureFlags | undefined;

/**
 * rrweb capture'ı aç/kapa; flag'ler izin/policy'yi belirler.
 */
export function configureRrwebLogger(flags: FeatureFlags) {
  featureFlags = flags;
}

/**
 * rrweb retention süresini dakikayla ayarlar.
 */
export function setRrwebRetention(minutes: number) {
  retentionMs = Math.max(1, minutes) * 60 * 1000;
}

/**
 * rrweb event'lerini kopyalayarak döndürür.
 */
export function getRrwebLogs(): RrwebLogEntry[] {
  return [...rrwebLogs];
}

/**
 * Eski rrweb kayıtlarını timestamp'e göre budar.
 */
export function cleanupRrwebLogs() {
  pruneByTime(rrwebLogs, retentionMs, "timestamp");
}

/**
 * rrweb recorder'ı başlatır, her event'i publish eder; izin yoksa sessiz çıkar.
 */
export function startRrwebRecorder() {
  if (typeof window === "undefined") return;
  if (stopRecording) return;
  if (featureFlags?.captureRrweb === false) return;

  stopRecording = record({
    emit(event) {
      const entry: RrwebLogEntry = {
        id: createId(),
        timestamp: nowIso(),
        event,
        origin: "rrweb",
      };
      rrwebLogs.push(entry);
      loggerService.emit("rrweb", "info", entry);
      cleanupRrwebLogs();
    },
  }) || null;

  loggerService.emit("rrweb", "info", {
    id: createId(),
    timestamp: nowIso(),
    event: { type: "init" } as any,
    origin: "rrweb",
  });
}

/**
 * rrweb recorder'ı durdurur; idempotent çalışır.
 */
export function stopRrwebRecorder() {
  if (stopRecording) {
    stopRecording();
    stopRecording = null;
  }
}
