import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  REQUIRED_API_SECURITY_HEADER_KEYS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  getApiSecurityHeaders,
  getPageSecurityHeaders,
  buildCspValue,
} from "./security-headers";

// CJS shim used by next.config.js — must stay parity-compatible with TS module.
const requireCjs = createRequire(import.meta.url);
const cjs = requireCjs("./security-headers.js") as typeof import("./security-headers");

describe("security header ownership + TS/CJS parity", () => {
  it("next.config.js is the sole page-header owner via getPageSecurityHeaders", () => {
    const nextConfig = readFileSync(join(__dirname, "../next.config.js"), "utf8");
    const middleware = readFileSync(join(__dirname, "../middleware.ts"), "utf8");

    expect(nextConfig).toMatch(/getPageSecurityHeaders/);
    expect(nextConfig).toMatch(/source:\s*"\/:path\*"/);
    expect(nextConfig).toMatch(/Strict-Transport-Security/);

    expect(middleware).not.toMatch(/getPageSecurityHeaders/);
    expect(middleware).not.toMatch(/applyPageSecurityHeaders/);
    expect(middleware).not.toMatch(/Content-Security-Policy/);
    expect(middleware).not.toMatch(/Strict-Transport-Security/);
    expect(middleware).toMatch(/applyApiSecurityHeadersToHeaders/);
  });

  it("worker-bootstrap API fallback sets API keys with Headers.set (no CSP)", () => {
    const workerSrc = readFileSync(join(__dirname, "../worker-bootstrap.js"), "utf8");
    for (const key of REQUIRED_API_SECURITY_HEADER_KEYS) {
      expect(workerSrc).toContain(key);
    }
    expect(workerSrc).toMatch(/headers\.set\(/);
    expect(workerSrc).not.toMatch(/Content-Security-Policy/);
    expect(workerSrc).not.toMatch(/Strict-Transport-Security/);
  });

  it("TS and CJS page/API header values stay parity-compatible", () => {
    const tsPage = getPageSecurityHeaders(false);
    const cjsPage = cjs.getPageSecurityHeaders(false);
    expect(cjsPage).toEqual(tsPage);

    const tsApi = getApiSecurityHeaders();
    const cjsApi = cjs.getApiSecurityHeaders();
    expect(cjsApi).toEqual(tsApi);

    expect(cjs.buildCspValue(false)).toBe(buildCspValue(false));
    expect(cjs.buildCspValue(true)).toBe(buildCspValue(true));

    expect(cjs.REQUIRED_PAGE_SECURITY_HEADER_KEYS).toEqual([
      ...REQUIRED_PAGE_SECURITY_HEADER_KEYS,
    ]);
    expect(cjs.REQUIRED_API_SECURITY_HEADER_KEYS).toEqual([
      ...REQUIRED_API_SECURITY_HEADER_KEYS,
    ]);
  });

  it("page singleton keys have no joined-duplicate-prone comma in simple headers", () => {
    for (const { key, value } of getPageSecurityHeaders(false)) {
      if (key === "Permissions-Policy" || key === "Content-Security-Policy") continue;
      expect(value, key).not.toMatch(/,/);
    }
  });

  it("Permissions-Policy directives appear once (comma separates distinct keys only)", () => {
    const pp = getPageSecurityHeaders(false).find((h) => h.key === "Permissions-Policy")!.value;
    for (const marker of ["camera=", "microphone=", "geolocation=", "interest-cohort="]) {
      expect(pp.split(marker).length - 1).toBe(1);
    }
  });
});
