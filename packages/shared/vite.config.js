import { join } from 'node:path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { node } from '../../.electron-vendors.cache.json';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  build: {
    ssr: true,
    sourcemap: true,
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
    plugins: [
      sentryVitePlugin({
        org: 'decentraland',
        project: 'launcher',
        disable: process.env.MODE === 'development' || process.env.DRY_RUN,
      }),
    ],
  },
};

export default config;
