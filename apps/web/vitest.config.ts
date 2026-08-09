import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Vitest 4.1+ transforms via oxc and ignores esbuild.jsx.
 * `oxc` is a runtime Vite/Vitest option; package typings differ across vite 7/8,
 * so it is applied via a typed-safe spread (keeps CI `tsc --noEmit` green).
 */
const oxcJsx = {
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
} as Record<string, unknown>;

export default defineConfig({
  ...oxcJsx,
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["**/audit_*/**", "**/tests/e2e/**", "**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@aistroyka/contracts": path.resolve(__dirname, "../../packages/contracts/dist/index.js"),
    },
  },
});
