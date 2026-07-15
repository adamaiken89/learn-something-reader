import path from 'path';
import { defineConfig, type Plugin } from 'vite';

import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

function mockViewPlugin(): Plugin {
  const enabled = process.env.VITE_E2E === 'true';
  if (!enabled) return { name: 'mock-view' };

  const entryPath = path.resolve(__dirname, 'src/mainview/__e2e__/mock-view-entry.ts');

  return {
    name: 'mock-view',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'electrobun/view') return '\0virtual:e2e-mock-view';
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
