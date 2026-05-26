import { describe, expect, it } from "vitest";
import { isLiteWorkerClient } from "./client-profile";
import type { TenantContext } from "./tenant.types";

const ctx = (profile: TenantContext["clientProfile"]): TenantContext => ({
  tenantId: "t",
  userId: "u",
  role: "member",
  subscriptionTier: "free",
  clientProfile: profile,
  traceId: "x",
});

describe("isLiteWorkerClient", () => {
  it("is true for field-worker profiles (legacy lite + canonical worker)", () => {
    expect(isLiteWorkerClient(ctx("ios_lite"))).toBe(true);
    expect(isLiteWorkerClient(ctx("android_lite"))).toBe(true);
    expect(isLiteWorkerClient(ctx("ios_worker"))).toBe(true);
    expect(isLiteWorkerClient(ctx("android_worker"))).toBe(true);
  });
  it("is false for web and manager/full clients", () => {
    expect(isLiteWorkerClient(ctx("web"))).toBe(false);
    expect(isLiteWorkerClient(ctx("ios_manager"))).toBe(false);
    expect(isLiteWorkerClient(ctx("android_manager"))).toBe(false);
    expect(isLiteWorkerClient(ctx("ios_full"))).toBe(false);
    expect(isLiteWorkerClient(ctx("android_full"))).toBe(false);
  });
});
