import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/football-data': {
          target: 'https://api.football-data.org',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/football-data/, ''),
        },
        '/api/odds': {
          target: 'https://api.the-odds-api.com',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/odds/, ''),
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
      'process.env.FOOTBALL_DATA_API_KEY': JSON.stringify(env.FOOTBALL_DATA_API_KEY || ''),
      'process.env.ODDS_API_KEY': JSON.stringify(env.ODDS_API_KEY || ''),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
      'import.meta.env.VITE_FOOTBALL_DATA_API_KEY': JSON.stringify(env.FOOTBALL_DATA_API_KEY || ''),
      'import.meta.env.VITE_ODDS_API_KEY': JSON.stringify(env.ODDS_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
