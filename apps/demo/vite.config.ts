import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@certeafiles/editor': path.resolve(__dirname, '../../packages/editor/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
