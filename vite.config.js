import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Configuration pour éviter les problèmes avec esbuild
      jsxRuntime: 'automatic',
    })
  ],
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
    // Utiliser terser au lieu d'esbuild pour éviter les erreurs EPIPE
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Options pour améliorer la stabilité du build
    target: 'esnext',
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },
});
