import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "es2020",
  sourcemap: true,
  treeshake: true,
  dts: true,
  exports: false,
  unbundle: true,
  logLevel: "error",
});
