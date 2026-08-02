import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: [
      "**/audit_*/**",
      "**/tests/e2e/**",
      "**/tests/qa/**",
      "**/tests/platform-admin/**",
      "**/tests/phase3a/**",
      "**/tests/phase3b/**",
      "**/tests/phase3c/**",
      "**/tests/phase3d/**",
      // Playwright Phase 3E browser specs; keep *.test.ts contract units via include.
      "**/tests/phase3e/**/*.spec.ts",
      // Playwright Phase 4 API specs; keep *.test.ts contract units via include.
      "**/tests/phase4/**/*.spec.ts",
      "**/node_modules/**",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@aistroyka/contracts": path.resolve(__dirname, "../../packages/contracts/dist/index.js"),
    },
  },
});
