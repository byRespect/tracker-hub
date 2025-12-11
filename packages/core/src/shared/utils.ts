export type IdFactory = () => string;

/** Mikro ID üretir; time + randomness karışımı. */
export const createId: IdFactory = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
