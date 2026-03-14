import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "functions/index": "src/functions/index.ts",
  },
  format: ["esm"],
  target: "node22",
  sourcemap: true,
  treeshake: true,
  dts: true,
  exports: false,
  unbundle: true,
  logLevel: "error",
});
