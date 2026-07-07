import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      'firebase/app': path.resolve(__dirname, './pocketbase-compat.ts'),
      'firebase/auth': path.resolve(__dirname, './pocketbase-compat.ts'),
      'firebase/firestore': path.resolve(__dirname, './pocketbase-compat.ts'),
      'firebase/functions': path.resolve(__dirname, './pocketbase-compat.ts'),
      'firebase/storage': path.resolve(__dirname, './pocketbase-compat.ts'),
    }
  },
  base: command === 'serve' ? '/' : '/sys-v2-platform/',
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['rostrodorado.site', 'www.rostrodorado.site', 'rostrodorado.com', 'www.rostrodorado.com', 'localhost']
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: ['rostrodorado.site', 'www.rostrodorado.site', 'rostrodorado.com', 'www.rostrodorado.com', 'localhost']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('@google/generative-ai')) return 'gen-ai';
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('react-router-dom') || id.includes('@remix-run')) return 'react-router';
            return 'vendor';
          }
        }
      }
    },
    sourcemap: true
  }
}));