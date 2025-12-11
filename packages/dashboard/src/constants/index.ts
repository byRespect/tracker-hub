/**
 * Application Constants - Uygulama genelinde kullanılan sabitler
 * 
 * Version bilgisi Vite build sırasında package.json'dan alınır.
 * Diğer sabit değerler burada tanımlanır.
 */

// Uygulama bilgileri - VERSION, package.json'dan Vite tarafından inject edilir
export const APP_CONFIG = {
  VERSION: __APP_VERSION__,
  STATUS: 'Stable',
  SYSTEM_STATUS: 'System Online',
} as const;
