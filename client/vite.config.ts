import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // In development, /api goes to the Express server — same as the Vercel rewrite on Day 5
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
    },
  },
});
