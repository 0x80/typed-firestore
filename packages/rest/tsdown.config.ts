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
  /**
   * `platform: "neutral"` changes tsdown's default output extensions to `.js`
   * and `.d.ts`, which would no longer match the `.mjs` / `.d.mts` entry points
   * this package's manifest declares. Pin them so the published files are the
   * ones `main`, `types` and `exports` name.
   */
  fixedExtension: true,
  sourcemap: true,
  treeshake: true,
  dts: true,
  exports: false,
  unbundle: true,
  logLevel: "error",
});
