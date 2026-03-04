import { describe, expect, it } from "vitest";
import { requireTenant, TenantRequiredError } from "./tenant.guard";
import { isTenantContextPresent } from "./tenant.types";

describe("tenant guard", () => {
  it("requireTenant throws when tenantId is null", () => {
    const ctx = { tenantId: null, userId: "u1", role: null, subscriptionTier: null, clientProfile: "web" as const, traceId: "t1" };
    expect(() => requireTenant(ctx)).toThrow(TenantRequiredError);
    expect(() => requireTenant(ctx)).toThrow("User has no tenant membership");
  });

  it("requireTenant throws when userId is null", () => {
    const ctx = { tenantId: null, userId: null, role: null, subscriptionTier: null, clientProfile: "web" as const, traceId: "t1" };
    expect(() => requireTenant(ctx)).toThrow(TenantRequiredError);
    expect(() => requireTenant(ctx)).toThrow("Authentication required");
  });

  it("requireTenant does not throw when context is present", () => {
    const ctx = { tenantId: "tid", userId: "u1", role: "member" as const, subscriptionTier: "free", clientProfile: "web" as const, traceId: "t1" };
    requireTenant(ctx);
  });
});

describe("isTenantContextPresent", () => {
  it("returns false for absent", () => {
    expect(isTenantContextPresent({ tenantId: null, userId: null, role: null, subscriptionTier: null, clientProfile: "web", traceId: "t" })).toBe(false);
  });
  it("returns true for present", () => {
    expect(isTenantContextPresent({ tenantId: "t", userId: "u", role: "member", subscriptionTier: "free", clientProfile: "web", traceId: "t" })).toBe(true);
  });
});
