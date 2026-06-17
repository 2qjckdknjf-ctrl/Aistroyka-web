import { describe, expect, it } from "vitest";
import {
  REQUIRED_API_SECURITY_HEADER_KEYS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
} from "@/lib/security-headers";

describe("security headers (route policy)", () => {
  it("page profile keys match middleware expectations", () => {
    expect(REQUIRED_PAGE_SECURITY_HEADER_KEYS).toContain("Content-Security-Policy");
    expect(REQUIRED_PAGE_SECURITY_HEADER_KEYS).toContain("X-Frame-Options");
  });

  it("api profile keys omit CSP", () => {
    expect(REQUIRED_API_SECURITY_HEADER_KEYS).not.toContain("Content-Security-Policy");
    expect(REQUIRED_API_SECURITY_HEADER_KEYS).toContain("X-Content-Type-Options");
  });
});
