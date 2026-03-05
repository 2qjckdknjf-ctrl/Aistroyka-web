import { describe, it, expect } from "vitest";
import { SECURITY_HEADERS, REQUIRED_SECURITY_HEADER_KEYS } from "./security-headers";

describe("security-headers", () => {
  it("defines all required security header keys", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    for (const required of REQUIRED_SECURITY_HEADER_KEYS) {
      expect(keys).toContain(required);
    }
  });

  it("X-Content-Type-Options is nosniff", () => {
    const h = SECURITY_HEADERS.find((x) => x.key === "X-Content-Type-Options");
    expect(h?.value).toBe("nosniff");
  });

  it("X-Frame-Options is DENY", () => {
    const h = SECURITY_HEADERS.find((x) => x.key === "X-Frame-Options");
    expect(h?.value).toBe("DENY");
  });
});
