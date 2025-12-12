export type IdFactory = () => string;

/** Mikro ID üretir; cryptographically secure random string. */
export const createId: IdFactory = () => {
  // Use crypto.randomUUID if available (Node 14.17+, modern browsers)
  if (typeof globalThis.crypto !== 'undefined') {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    // Fallback for browsers without randomUUID
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const array = new Uint8Array(16);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
    }
  }
  // Node.js fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require("crypto");
    if (typeof nodeCrypto.randomUUID === "function") {
      return nodeCrypto.randomUUID();
    }
    return nodeCrypto.randomBytes(16).toString("hex");
  } catch (e) {
    // As a last very-resilient fallback, still use Math.random, but this should never be hit
    return `${Date.now()}-fallback-${Math.random().toString(36).slice(2, 12)}`;
  }
};

/** ISO tarih string'i döndürür; testlerde deterministik değildir. */
export const nowIso = () => new Date().toISOString();

/**
 * time field'a bakarak listeden eski kayıtları keser.
 * Mutasyon yapar; uzun listede ilk uygun index'ten itibaren splice eder.
 */
export function pruneByTime<T>(list: T[], maxAgeMs: number, timeField: keyof T & string) {
  const cutoff = Date.now() - maxAgeMs;
  const idx = list.findIndex((item) => {
    // timeField değeri string/number/tarih olabilir; en kaba haliyle yorumlanır.
    const value = (item as any)[timeField];
    const ts = typeof value === "string" ? new Date(value).getTime() : Number(value);
    return ts >= cutoff;
  });
  if (idx > 0) {
    list.splice(0, idx);
  }
}
