import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: process.env.POSTMAKER_BASE_PATH || '/postmaker/',
  plugins: [react()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: { outDir: '../../dist/web', emptyOutDir: true },
  preview: { host: '127.0.0.1', port: 4173 }
});
