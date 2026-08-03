import { defineConfig } from "tsdown";

/**
 * Unlike the other packages in this monorepo, the REST package does not target
 * Node specifically. It only needs `fetch` and `crypto.subtle`, so the build
 * targets a plain modern ECMAScript baseline that workerd, Deno, Bun and Node
 * all satisfy.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "es2022",
  platform: "neutral",
  sourcemap: true,
  treeshake: true,
  dts: true,
  exports: false,
  unbundle: true,
  logLevel: "error",
});
