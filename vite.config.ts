import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import express from 'express';
import dotenv from 'dotenv';
import geminiHandler from './api/gemini';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

// Carrega variáveis de ambiente para a API (GEMINI_API_KEY, etc.) a partir da raiz do projeto
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      // API Gemini no mesmo processo (porta 3000) – sem proxy nem segundo processo
      {
        name: 'api-gemini',
        configureServer(server) {
          // Garante que GEMINI_API_KEY está em process.env (cwd pode ser outro ao carregar o config)
          dotenv.config({ path: path.join(root, '.env') });
          dotenv.config({ path: path.join(root, '.env.local'), override: true });
          if (!process.env.GEMINI_API_KEY) {
            console.warn('[api-gemini] GEMINI_API_KEY não encontrada em .env ou .env.local. A API de IA retornará 500.');
          }
          const apiApp = express();
          apiApp.use(express.json({ limit: '10mb' }));
          apiApp.options('/gemini', (_req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).end();
          });
          apiApp.post('/gemini', async (req, res) => {
            try {
              await geminiHandler(req as any, res as any);
            } catch (err) {
              console.error('API Gemini error:', err);
              res.status(500).json({ error: 'Internal Server Error' });
            }
          });
          server.middlewares.use('/api', apiApp);
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'favicon.ico', 'icon-*.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'NutriSmart',
          short_name: 'NutriSmart',
          description: 'Seu assistente de nutrição inteligente com IA',
          theme_color: '#22c55e',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
              },
            },
            {
              urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'openfoodfacts-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
          ],
        },
      }),
    ],
    // Environment variables with VITE_ prefix are automatically available
    // GEMINI_API_KEY is now server-side only (no VITE_ prefix)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
