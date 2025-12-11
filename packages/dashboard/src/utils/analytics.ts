/**
 * Analytics Utils - Session veri analizi fonksiyonları
 * 
 * Bu modül session verilerini analiz ederek dashboard'da
 * gösterilecek metrikleri hesaplar.
 */

import type { Session, SessionAnalytics, TrafficBucket, NetworkLog, ConsoleLog } from '../types';

// Sabitler
const BUCKET_COUNT = 30;
const TIME_BUFFER_RATIO = 0.05;
const MIN_DURATION_MS = 1000;
const MIN_BAR_HEIGHT = 15;
const EMPTY_BAR_HEIGHT = 4;
const MAX_ALERTS_DISPLAY = 10;

/**
 * Session verisinden analitik özet oluşturur
 * 
 * Console log'ları, network istekleri ve DOM event'lerini
 * analiz ederek dashboard widget'ları için veri üretir.
 */
export function generateSessionAnalytics(session: Session): SessionAnalytics {
  const logs = session.consoleLogs || [];
  const requests = session.networkLogs || [];
  const events = session.domEvents || [];

  // Hata ve uyarı sayıları
  const errorCount = countByMethod(logs, 'error');
  const warningCount = countByMethod(logs, 'warn');

  // Ortalama response süresi (ms)
  const avgLatency = calculateAverageLatency(requests);

  // HTTP method dağılımı
  const requestMethods = groupByMethod(requests);

  // Traffic volume grafiği için bucket'lar
  const trafficVolume = generateTrafficBuckets(requests);

  // Son hata/uyarılar
  const recentAlerts = logs
    .filter(l => l.method === 'error' || l.method === 'warn')
    .slice(0, MAX_ALERTS_DISPLAY);

  return {
    totalRequests: requests.length,
    avgLatency,
    errorCount,
    warningCount,
    domEventCount: events.length,
    trafficVolume,
    requestMethods,
    recentAlerts,
    user: session.user,
    userAgent: session.userAgent,
  };
}

/**
 * Belirli method tipindeki log sayısını döner
 */
function countByMethod(logs: ConsoleLog[], method: string): number {
  return logs.filter(log => log.method === method).length;
}

/**
 * Tamamlanmış isteklerin ortalama süresini hesaplar
 */
function calculateAverageLatency(requests: NetworkLog[]): number {
  const completed = requests.filter(r => r.durationMs != null && r.durationMs > 0);
  
  if (completed.length === 0) {
    return 0;
  }
  
  const totalDuration = completed.reduce((sum, req) => sum + (req.durationMs || 0), 0);
  return Math.round(totalDuration / completed.length);
}

/**
 * İstekleri HTTP method'a göre gruplar
 */
function groupByMethod(requests: NetworkLog[]): Record<string, number> {
  const groups: Record<string, number> = {};
  
  for (const req of requests) {
    groups[req.method] = (groups[req.method] || 0) + 1;
  }
  
  return groups;
}

/**
 * Network isteklerinden traffic volume bucket'ları oluşturur
 * 
 * Dinamik zaman penceresi kullanarak istekleri eşit aralıklı
 * bucket'lara böler. Her bucket'ın yüksekliği o zaman dilimindeki
 * istek sayısına göre normalize edilir.
 */
export function generateTrafficBuckets(requests: NetworkLog[]): TrafficBucket[] {
  // Boş veri için placeholder bucket'lar
  if (requests.length === 0) {
    return createEmptyBuckets();
  }

  // Timestamp'leri normalize et (string/number mixed olabilir)
  const timestamps = requests.map(normalizeTimestamp);
  
  // Zaman aralığını hesapla (buffer ile)
  const { minTime, maxTime, bucketSize } = calculateTimeRange(timestamps);
  
  // İstekleri bucket'lara dağıt
  const counts = new Array<number>(BUCKET_COUNT).fill(0);
  
  for (const ts of timestamps) {
    if (ts >= minTime && ts <= maxTime) {
      const index = Math.min(
        Math.floor((ts - minTime) / bucketSize),
        BUCKET_COUNT - 1
      );
      counts[index]++;
    }
  }
  
  // Bucket'ları normalize edilmiş yüksekliklerle döndür
  const maxCount = Math.max(...counts, 1);
  
  return counts.map((count, index) => ({
    height: count === 0 ? EMPTY_BAR_HEIGHT : Math.max(MIN_BAR_HEIGHT, (count / maxCount) * 100),
    active: count > 0,
    count,
    timestamp: minTime + index * bucketSize,
  }));
}

/**
 * Timestamp'i number'a çevirir
 */
function normalizeTimestamp(req: NetworkLog): number {
  return typeof req.timestamp === 'string' 
    ? new Date(req.timestamp).getTime() 
    : req.timestamp;
}

/**
 * Zaman aralığı ve bucket boyutunu hesaplar
 */
function calculateTimeRange(timestamps: number[]) {
  let minTime = Math.min(...timestamps);
  let maxTime = Math.max(...timestamps);
  
  // Minimum süre garantisi ve buffer ekle
  const duration = Math.max(maxTime - minTime, MIN_DURATION_MS);
  const buffer = duration * TIME_BUFFER_RATIO;
  
  minTime -= buffer;
  maxTime += buffer;
  
  const bucketSize = (maxTime - minTime) / BUCKET_COUNT;
  
  return { minTime, maxTime, bucketSize };
}

/**
 * Boş veri için placeholder bucket'lar oluşturur
 */
function createEmptyBuckets(): TrafficBucket[] {
  const now = Date.now();
  
  return Array.from({ length: BUCKET_COUNT }, (_, index) => ({
    height: EMPTY_BAR_HEIGHT,
    active: false,
    count: 0,
    timestamp: now - (BUCKET_COUNT - index) * 1000,
  }));
}
