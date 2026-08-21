import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // Without these, a stale service worker can keep serving an old cached index.html that
        // references JS chunk hashes from a previous build — once Vercel stops serving those old
        // files, the SPA rewrite falls back to index.html for them, the browser gets HTML where
        // it expected a JS module, and the app never boots (blank screen). clientsClaim +
        // skipWaiting make a new SW take over existing open tabs immediately instead of waiting
        // for every tab to close first; cleanupOutdatedCaches drops old precache entries instead
        // of leaving them around to be served by mistake.
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Xen Dance Space',
          short_name: 'XDS',
          description: 'Portal del alumno y gestión de Xen Dance Space',
          theme_color: '#581c87', // Purple 900
          background_color: '#111827', // Gray 900
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
