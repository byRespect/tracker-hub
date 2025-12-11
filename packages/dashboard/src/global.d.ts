/**
 * Global Type Declarations
 * 
 * TypeScript için modül ve ortam tanımlamaları.
 */

// CSS modül import'ları için
declare module '*.css';

// Vite build-time değişkenleri
declare const __APP_VERSION__: string;

// Vite ortam değişkenleri
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
