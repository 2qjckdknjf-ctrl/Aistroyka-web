import { describe, expect, it } from "vitest";
import { canManageWorkerDay } from "./worker-day.policy";

describe("worker-day.policy", () => {
  const ctx = (role: "owner" | "admin" | "member" | "viewer") =>
    ({ tenantId: "t", userId: "u", role, subscriptionTier: "free", clientProfile: "web" as const, traceId: "x" });

  it("allows member and above to manage worker day", () => {
    expect(canManageWorkerDay(ctx("owner"))).toBe(true);
    expect(canManageWorkerDay(ctx("admin"))).toBe(true);
    expect(canManageWorkerDay(ctx("member"))).toBe(true);
  });

  it("denies viewer", () => {
    expect(canManageWorkerDay(ctx("viewer"))).toBe(false);
  });
});
