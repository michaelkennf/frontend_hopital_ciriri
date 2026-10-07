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
      'polycliniquedesapotres.org',
      'www.polycliniquedesapotres.org',
      'localhost',
      '127.0.0.1',
      '.polycliniquedesapotres.org'
    ],
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.polycliniquedesapotres.org http://localhost:4007 http://localhost:5000; connect-src 'self' https://api.polycliniquedesapotres.org http://localhost:4007 http://localhost:5000; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Désactiver le minify pour éviter les erreurs (ou installer terser)
    minify: false,
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
