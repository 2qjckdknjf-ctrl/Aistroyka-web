import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SECURITY_HEADERS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  REQUIRED_API_SECURITY_HEADER_KEYS,
  getApiSecurityHeaders,
  getPageSecurityHeaders,
  applySecurityHeadersToResponse,
  applyApiSecurityHeadersToHeaders,
} from "./security-headers";

describe("security-headers", () => {
  it("page profile defines all required security header keys", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    for (const required of REQUIRED_PAGE_SECURITY_HEADER_KEYS) {
      expect(keys).toContain(required);
    }
  });

  it("api profile omits CSP but keeps hardening headers", () => {
    const keys = getApiSecurityHeaders().map((h) => h.key);
    for (const required of REQUIRED_API_SECURITY_HEADER_KEYS) {
      expect(keys).toContain(required);
    }
    expect(keys).not.toContain("Content-Security-Policy");
  });

  it("X-Content-Type-Options is nosniff on page profile", () => {
    const h = getPageSecurityHeaders().find((x) => x.key === "X-Content-Type-Options");
    expect(h?.value).toBe("nosniff");
  });

  it("X-Frame-Options is DENY on page profile", () => {
    const h = getPageSecurityHeaders().find((x) => x.key === "X-Frame-Options");
    expect(h?.value).toBe("DENY");
  });

  it("applySecurityHeadersToResponse api profile sets required headers without CSP", () => {
    const res = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "api");
    for (const required of REQUIRED_API_SECURITY_HEADER_KEYS) {
      expect(res.headers.get(required)).toBeTruthy();
    }
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("applySecurityHeadersToResponse page profile sets CSP", () => {
    const res = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "page", {
      isProduction: false,
      isDevelopment: true,
    });
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("applyApiSecurityHeadersToHeaders matches getApiSecurityHeaders values", () => {
    const headers = new Headers();
    applyApiSecurityHeadersToHeaders(headers);
    for (const { key, value } of getApiSecurityHeaders()) {
      expect(headers.get(key)).toBe(value);
    }
    expect(headers.get("Content-Security-Policy")).toBeNull();
  });

  it("worker-bootstrap keeps API header keys in sync with source of truth", () => {
    const workerSrc = readFileSync(join(__dirname, "../worker-bootstrap.js"), "utf8");
    for (const key of REQUIRED_API_SECURITY_HEADER_KEYS) {
      expect(workerSrc).toContain(key);
    }
    expect(workerSrc).not.toMatch(/Content-Security-Policy/);
  });
});
