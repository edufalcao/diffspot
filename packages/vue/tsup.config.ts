import { defineConfig } from 'tsup';
import UnpluginVue from 'unplugin-vue/esbuild';

export default defineConfig({
  entry: { index: 'src/index.ts', worker: 'src/worker.ts' },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [
    UnpluginVue({
      isProduction: true
    })
  ],
  external: ['vue', '@diffspot/core']
});
