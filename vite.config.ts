import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3020,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
