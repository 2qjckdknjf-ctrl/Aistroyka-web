import { describe, expect, it } from "vitest";
import { isIpBlockedByOwnerAllowlist } from "./client-ip";

describe("isIpBlockedByOwnerAllowlist", () => {
  it("allows any IP when allowlist empty", () => {
    expect(isIpBlockedByOwnerAllowlist("1.2.3.4", undefined)).toBe(false);
    expect(isIpBlockedByOwnerAllowlist(null, undefined)).toBe(false);
  });

  it("blocks when allowlist set but IP missing", () => {
    expect(isIpBlockedByOwnerAllowlist(null, "203.0.113.1")).toBe(true);
  });

  it("allows exact IPv4 match", () => {
    expect(isIpBlockedByOwnerAllowlist("203.0.113.10", "203.0.113.10")).toBe(false);
  });

  it("allows CIDR match", () => {
    expect(isIpBlockedByOwnerAllowlist("10.0.0.5", "10.0.0.0/24")).toBe(false);
    expect(isIpBlockedByOwnerAllowlist("10.0.1.5", "10.0.0.0/24")).toBe(true);
  });
});
