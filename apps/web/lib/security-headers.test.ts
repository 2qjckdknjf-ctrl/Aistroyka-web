import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SECURITY_HEADERS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  REQUIRED_API_SECURITY_HEADER_KEYS,
  REQUIRED_STATIC_SECURITY_HEADER_KEYS,
  getApiSecurityHeaders,
  getPageSecurityHeaders,
  getStaticSecurityHeaders,
  applySecurityHeadersToResponse,
  applyApiSecurityHeadersToHeaders,
  buildCspValue,
  buildNextConfigStaticHeaderRules,
  collapseDuplicateSecurityHeaderValue,
  STATIC_SECURITY_HEADER_SOURCES,
  HSTS_HEADER,
  HSTS_VALUE,
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

  it("static profile is nosniff-only (no CSP / frame / permissions)", () => {
    const headers = getStaticSecurityHeaders();
    expect(headers.map((h) => h.key)).toEqual([...REQUIRED_STATIC_SECURITY_HEADER_KEYS]);
    expect(headers[0]?.value).toBe("nosniff");
    expect(headers.some((h) => h.key === "Content-Security-Policy")).toBe(false);
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
    const res = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "api", {
      isProduction: false,
    });
    for (const { key, value } of getApiSecurityHeaders()) {
      expect(res.headers.get(key)).toBe(value);
    }
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(res.headers.get(HSTS_HEADER)).toBeNull();
  });

  it("applySecurityHeadersToResponse page profile sets exact CSP and no HSTS outside production", () => {
    const expectedCsp = buildCspValue(true);
    const res = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "page", {
      isProduction: false,
      isDevelopment: true,
    });
    expect(res.headers.get("Content-Security-Policy")).toBe(expectedCsp);
    expect(res.headers.get(HSTS_HEADER)).toBeNull();
  });

  it("applySecurityHeadersToResponse static profile sets nosniff without HSTS outside production", () => {
    const res = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "static", {
      isProduction: false,
    });
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(res.headers.get(HSTS_HEADER)).toBeNull();
  });

  it("applySecurityHeadersToResponse sets HSTS once for page, api, and static in production", () => {
    const page = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "page", {
      isProduction: true,
      isDevelopment: false,
    });
    const api = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "api", {
      isProduction: true,
    });
    const staticRes = applySecurityHeadersToResponse(new Response(null, { status: 200 }), "static", {
      isProduction: true,
    });
    expect(page.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    expect(api.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    expect(staticRes.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    expect(staticRes.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("re-applying headers via set yields a single exact value (no duplicated join)", () => {
    const res = new Response(null, { status: 200 });
    applySecurityHeadersToResponse(res, "page", { isProduction: true, isDevelopment: false });
    applySecurityHeadersToResponse(res, "page", { isProduction: true, isDevelopment: false });
    const expectedCsp = buildCspValue(false);
    expect(res.headers.get("Content-Security-Policy")).toBe(expectedCsp);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get(HSTS_HEADER)).toBe(HSTS_VALUE);
    for (const { key, value } of getPageSecurityHeaders(false)) {
      expect(res.headers.get(key)).toBe(value);
    }
  });

  it("applyApiSecurityHeadersToHeaders matches getApiSecurityHeaders values", () => {
    const headers = new Headers();
    applyApiSecurityHeadersToHeaders(headers, { isProduction: false });
    for (const { key, value } of getApiSecurityHeaders()) {
      expect(headers.get(key)).toBe(value);
    }
    expect(headers.get("Content-Security-Policy")).toBeNull();
    expect(headers.get(HSTS_HEADER)).toBeNull();
  });

  it("worker-bootstrap keeps API header keys in sync with source of truth", () => {
    const workerSrc = readFileSync(join(__dirname, "../worker-bootstrap.js"), "utf8");
    for (const key of REQUIRED_API_SECURITY_HEADER_KEYS) {
      expect(workerSrc).toContain(key);
    }
    expect(workerSrc).toContain("collapseDuplicatedSecurityHeaders");
    expect(workerSrc).toContain("content-security-policy");
  });

  it("collapseDuplicateSecurityHeaderValue collapses identical OpenNext joins only", () => {
    expect(collapseDuplicateSecurityHeaderValue("nosniff")).toBe("nosniff");
    expect(collapseDuplicateSecurityHeaderValue("nosniff, nosniff")).toBe("nosniff");
    expect(collapseDuplicateSecurityHeaderValue("DENY, DENY")).toBe("DENY");
    expect(
      collapseDuplicateSecurityHeaderValue(
        "strict-origin-when-cross-origin, strict-origin-when-cross-origin"
      )
    ).toBe("strict-origin-when-cross-origin");
    const pp = "camera=(), microphone=(), geolocation=(), interest-cohort=()";
    expect(collapseDuplicateSecurityHeaderValue(`${pp}, ${pp}`)).toBe(pp);
    const csp = buildCspValue(false);
    expect(collapseDuplicateSecurityHeaderValue(`${csp}, ${csp}`)).toBe(csp);
    // Conflicting join must not be silently rewritten to a weaker single token.
    expect(collapseDuplicateSecurityHeaderValue("nosniff, something-else")).toBe(
      "nosniff, something-else"
    );
  });

  it("next.config.js owns only static header sources — no page/API overlap", () => {
    const nextConfigSrc = readFileSync(join(__dirname, "../next.config.js"), "utf8");
    expect(nextConfigSrc).toMatch(/buildNextConfigStaticHeaderRules/);
    expect(nextConfigSrc).toMatch(/\basync\s+headers\s*\(/);
    expect(nextConfigSrc).not.toMatch(/getPageSecurityHeaders/);
    expect(nextConfigSrc).not.toMatch(/getApiSecurityHeaders/);

    const rules = buildNextConfigStaticHeaderRules({ isProduction: true });
    const sources = rules.map((r) => r.source);
    expect(sources).toEqual([...STATIC_SECURITY_HEADER_SOURCES]);
    for (const rule of rules) {
      expect(rule.source === "/:path*" || rule.source.startsWith("/api")).toBe(false);
      expect(rule.headers.find((h) => h.key === "X-Content-Type-Options")?.value).toBe("nosniff");
      expect(rule.headers.find((h) => h.key === HSTS_HEADER)?.value).toBe(HSTS_VALUE);
      expect(rule.headers.some((h) => h.key === "Content-Security-Policy")).toBe(false);
    }

    const devRules = buildNextConfigStaticHeaderRules({ isProduction: false });
    for (const rule of devRules) {
      expect(rule.headers.some((h) => h.key === HSTS_HEADER)).toBe(false);
    }
  });
});
