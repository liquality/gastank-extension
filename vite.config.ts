import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import makeManifest from './utils/plugins/make-manifest';
import buildContentScript from './utils/plugins/build-content-script';
import { outputFolderName } from './utils/constants';
 
const root = resolve(__dirname, 'src');
const scriptsDir = resolve(root, 'scripts');
const outDir = resolve(__dirname, outputFolderName);
const publicDir = resolve(__dirname, 'public');

export default defineConfig({
  resolve: {
    alias: {
      '@': root
    },
  },
  plugins: [
    react(), 
    makeManifest(), 
    buildContentScript()
  ],
  publicDir,
  root, 
  build: {
    outDir,
    sourcemap: process.env.__DEV__ === 'true',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(scriptsDir, 'background', 'index.ts'),
        popup: resolve(root, 'index.html'),
      },
      output: {
        entryFileNames: (chunk) => `js/${chunk.name}/index.js`,
      },
    },
  },
});
