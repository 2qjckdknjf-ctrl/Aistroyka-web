import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Component tests import Next `.tsx` files (jsx: preserve).
 * Vitest 4.1 may transform via oxc or esbuild depending on the install;
 * inject React so classic JSX output does not throw `React is not defined`.
 * Applied via cast: `oxc` typings differ across vite 7/8 used by CI vs local.
 */
const jsxCompat = {
  esbuild: {
    jsx: "automatic",
    jsxInject: "import React from 'react'",
  },
  oxc: {
    jsx: {
      runtime: "automatic",
    },
    jsxInject: "import React from 'react'",
  },
} as Record<string, unknown>;

export default defineConfig({
  ...jsxCompat,
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
