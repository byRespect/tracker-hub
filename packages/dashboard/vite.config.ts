import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(packageJson.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
      assetsInclude: ['**/*.woff', '**/*.woff2'],
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            // Ignore known pure annotation positioning warnings from @microsoft/signalr
            if (warning.code === 'INVALID_ANNOTATION' &&
              typeof warning.message === 'string' &&
              warning.message.includes('@microsoft/signalr')) {
              return;
            }
            defaultHandler(warning);
          },
        },
      },
    };
});
