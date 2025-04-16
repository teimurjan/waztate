import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.esm.js'
    },
    target: 'esnext'
  },
  optimizeDeps: {
    exclude: ['@waztate/wasm']
  },
  plugins: [
    wasm(),
    dts(),
  ]
}); 