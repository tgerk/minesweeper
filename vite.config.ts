import { defineConfig } from 'vite';
import solidJS from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidJS()],
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  },
  base: '/minesweeper/'
});
