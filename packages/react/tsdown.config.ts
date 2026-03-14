import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  sourcemap: true,
  dts: true,
  treeshake: true,
  unbundle: true,
  exports: false,
  logLevel: "error",
});
