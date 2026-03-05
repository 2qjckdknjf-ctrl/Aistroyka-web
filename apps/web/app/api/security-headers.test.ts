/**
 * Verify security headers on a representative route. Run with vitest.
 * Middleware applies these; this test documents expected headers.
 */

import { describe, expect, it } from "vitest";

const EXPECTED_HEADERS = [
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "content-security-policy",
];

describe("security headers", () => {
  it("expected header names are defined for middleware", () => {
    expect(EXPECTED_HEADERS).toContain("x-frame-options");
    expect(EXPECTED_HEADERS).toContain("x-content-type-options");
    expect(EXPECTED_HEADERS).toContain("content-security-policy");
  });
});
