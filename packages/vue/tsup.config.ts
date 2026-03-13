import { defineConfig } from 'tsup';
import UnpluginVue from 'unplugin-vue/esbuild';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: false, // Vue SFCs require vue-tsc for type generation
  sourcemap: true,
  clean: true,
  esbuildPlugins: [
    UnpluginVue({
      isProduction: true
    })
  ],
  external: ['vue', '@diffspot/core']
});
