import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  preview: {
    port: 5008,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'polyclinique.fikiri.org',
      'localhost',
      '127.0.0.1',
      '.fikiri.org'
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
