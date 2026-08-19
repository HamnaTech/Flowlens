import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['three'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['three'],
  },
  server: {
    // Matches CORS_ORIGINS=http://localhost:3000 already set in the
    // backend's .env — keeping this in sync here means zero backend
    // config changes are needed to run both together locally.
    port: 3000,
    // Dev proxy: forwards /api/* requests to the NestJS backend on
    // port 4000. This makes the browser talk to the *same origin*
    // (no CORS preflight from the browser), while Vite forwards the
    // request server-side to http://localhost:4000. This works no
    // matter which port Vite actually binds to (3000, 3001, 5173…),
    // so a port conflict can't break login with a CORS "Network Error".
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});