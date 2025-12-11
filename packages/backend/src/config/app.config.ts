/**
 * Uygulama Yapılandırması
 * 
 * Tüm config değerleri environment variable'lardan okunur.
 * Production'da .env dosyası veya ortam değişkenleri kullanılmalıdır.
 * 
 * MongoDB bağlantısı için:
 * - Authentication gerekiyorsa: mongodb://user:password@localhost:27017/dbname?authSource=admin
 * - Authentication gerekmiyorsa: mongodb://localhost:27017/dbname
 */

export interface AppConfig {
  port: number;
  host: string;
  mongoUri: string;
}

// Development için default MongoDB URI
// Authentication gerektiren MongoDB için MONGO_URI environment variable kullanın
const DEFAULT_MONGO_URI = 'mongodb://trackr:trackr@localhost:27017/trackrdb?authSource=admin';

export function loadAppConfig(): AppConfig {
  const port = Number(process.env.PORT) || 1337;
  const host = process.env.HOST || '0.0.0.0';
  const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  return { port, host, mongoUri };
}
