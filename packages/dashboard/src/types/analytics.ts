/**
 * Analytics Types - Dashboard analitik veri modelleri
 */

import type { ConsoleLog } from './console';
import type { UserInfo } from './session';

// Traffic volume bar chart veri yapısı
export interface TrafficBucket {
  height: number;
  active: boolean;
  count: number;
  timestamp: number;
}

// Session analitik özeti
export interface SessionAnalytics {
  totalRequests: number;
  avgLatency: number;
  errorCount: number;
  warningCount: number;
  domEventCount: number;
  trafficVolume: TrafficBucket[];
  requestMethods: Record<string, number>;
  recentAlerts: ConsoleLog[];
  user?: UserInfo;
  userAgent?: string;
}
