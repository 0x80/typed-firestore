import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The `~` alias is resolved natively by tsdown and by tsc through the shared
 * tsconfig, but Vitest needs it spelled out.
 */
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
