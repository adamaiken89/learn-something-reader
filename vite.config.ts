import path from 'path';
import { defineConfig, type Plugin } from 'vite';

import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

// src/mainview/rpc.ts imports Electroview directly from the Hutch-projected
// devkit (no resolve.alias — Vite applies aliases before any resolveId hook,
// which would shadow this e2e mock). Match both the raw relative specifier and
// its fs-resolved absolute form.
const ELECTROVIEW_SUFFIXES = [
  '.hutch/devkit/api/browser/index',
  '.hutch/devkit/api/browser/index.ts',
];

function mockViewPlugin(): Plugin {
  const enabled = process.env.VITE_E2E === 'true';
  if (!enabled) return { name: 'mock-view' };

  const entryPath = path.resolve(__dirname, 'src/mainview/__e2e__/mock-view-entry.ts');

  return {
    name: 'mock-view',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'electrobun/view') return '\0virtual:e2e-mock-view';
      if (ELECTROVIEW_SUFFIXES.some((s) => id.includes(s))) {
        return '\0virtual:e2e-mock-view';
      }
    },
    load(id) {
      if (id !== '\0virtual:e2e-mock-view') return;
      return `export { Electroview } from '${entryPath}';`;
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    mockViewPlugin(),
  ],
  root: "src/mainview",
  base: "",
  resolve: {
    // '@' maps to the mainview root. Deliberately narrow: do NOT alias the
    // electroview devkit path — vite aliases resolve before any resolveId hook,
    // which would shadow mockViewPlugin (see ELECTROVIEW_SUFFIXES above).
    alias: {
      '@': path.resolve(__dirname, 'src/mainview'),
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    cssMinify: "lightningcss",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
