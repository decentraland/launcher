/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-env node */

import { join } from 'node:path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { renderer } from 'unplugin-auto-expose';
import { chrome } from '../../.electron-vendors.cache.json';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
console.log(PACKAGE_ROOT);
/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '#shared': join(PROJECT_ROOT, 'packages/shared/src/index.ts'),
      '/@assets/': join(PACKAGE_ROOT, 'assets') + '/',
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: join(PACKAGE_ROOT, 'index.html'),
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  test: {
    environment: 'happy-dom',
  },
  plugins: [
    react(),
    renderer.vite({
      preloadEntry: join(PROJECT_ROOT, 'packages/preload/src/index.ts'),
    }),
    sentryVitePlugin({
      org: 'decentraland',
      project: 'launcher',
      disable: process.env.MODE === 'development' || process.env.DRY_RUN,
    }),
  ],
};

export default config;
