// Builds a single self-contained HTML file of the SSR Directory + TDS Tool for offline use.
// Run: SNAPSHOT=/path/snapshot.json npx vite build --config offline/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

const src = path.resolve(__dirname, '../src');
const mocks = path.resolve(__dirname, 'mocks');
const snapshot = process.env.SNAPSHOT && fs.existsSync(process.env.SNAPSHOT)
  ? fs.readFileSync(process.env.SNAPSHOT, 'utf8')
  : '{"ssrs":[],"ssr_assets":[],"ssr_change_history":[]}';

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react(), viteSingleFile()],
  css: { postcss: path.resolve(__dirname, '..') },
  define: {
    __SNAPSHOT__: snapshot,
    __SNAPSHOT_DATE__: JSON.stringify(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })),
  },
  build: { outDir: process.env.OUT_DIR || '/tmp/offline-dist', emptyOutDir: true, assetsInlineLimit: 100_000_000 },
  resolve: {
    alias: [
      { find: '@/lib/supabase', replacement: path.join(mocks, 'supabase.ts') },
      { find: '@/contexts/AuthContext', replacement: path.join(mocks, 'AuthContext.tsx') },
      { find: '@/components/Header', replacement: path.join(mocks, 'Header.tsx') },
      { find: '@/components/BulkSSRUpload', replacement: path.join(mocks, 'BulkStub.tsx') },
      { find: '@/components/BulkAssetsUpload', replacement: path.join(mocks, 'BulkStub.tsx') },
      { find: '@', replacement: src },
    ],
  },
});
