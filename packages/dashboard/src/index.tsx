/**
 * Application Entry Point
 * 
 * Font'lar burada import edilerek Vite'ın build sürecinde
 * bundle'a dahil edilmesi sağlanır.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SessionProvider } from './store';

// Font import'ları (latin subset - optimize edilmiş boyut)
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';

// Global stiller
import './index.css';

// rrweb player stilleri
import 'rrweb/dist/style.css';
import 'rrweb-player/dist/style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element bulunamadı');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);