import { defineConfig } from "tsup";
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { worker: "src/worker.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
  },
]);
