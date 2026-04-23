import { describe, it, expect } from "vitest";
import { canTransition, requireInternalWorkspace } from "./governance.service";
import type { TenantContext } from "@/lib/tenant/tenant.types";

describe("governance.service", () => {
  it("canTransition allows forward paths and blocks invalid jumps", () => {
    expect(canTransition("open", "under_review")).toBe(true);
    expect(canTransition("open", "resolved")).toBe(false);
    expect(canTransition("decided", "resolved")).toBe(true);
    expect(canTransition("resolved", "archived")).toBe(true);
    expect(canTransition("archived", "open")).toBe(false);
  });

  it("requireInternalWorkspace blocks portal-only stakeholders", () => {
    const stakeholder: TenantContext = {
      tenantId: "t1",
      userId: "u1",
      role: "stakeholder",
      subscriptionTier: "free",
      clientProfile: "web",
      traceId: "x",
    };
    expect(requireInternalWorkspace(stakeholder)).toBe("Insufficient rights");
    const owner: TenantContext = {
      ...stakeholder,
      role: "owner",
    };
    expect(requireInternalWorkspace(owner)).toBeNull();
  });
});
