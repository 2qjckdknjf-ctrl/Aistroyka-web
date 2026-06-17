import { describe, it, expect } from "vitest";
import {
  SECURITY_HEADERS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  REQUIRED_API_SECURITY_HEADER_KEYS,
  getApiSecurityHeaders,
  getPageSecurityHeaders,
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
});
