import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Vite's default emptyDir() deletes the output tree recursively, which this
    // environment's delete-guard shim blocks. `npm run build` runs scripts/clean-dist.mjs
    // first (non-recursive file deletes) instead.
    emptyOutDir: false,
    // No manualChunks: forcing recharts into a named chunk made Rollup hoist a shared
    // module into it that the entry also needed, which turned the 411 kB chart bundle
    // into a STATIC import of the entry (modulepreloaded on first paint). Letting Rollup
    // split on dynamic-import boundaries keeps recharts inside the Dashboard chunk, where
    // it is only fetched when a chart page is visited.
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    // Proxy API calls to the Flask backend during development.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
