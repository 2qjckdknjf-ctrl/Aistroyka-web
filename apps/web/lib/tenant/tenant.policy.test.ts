import { describe, expect, it } from "vitest";
import { authorize, canManageProjects, canReadProjects, isPortalOnlyStakeholderRole } from "./tenant.policy";
import type { TenantRoleDb } from "./tenant.types";

const ctx = (role: TenantRoleDb) =>
  ({ tenantId: "t", userId: "u", role, subscriptionTier: "free", clientProfile: "web" as const, traceId: "t" });

describe("tenant policy", () => {
  it("owner can do tenant:settings and tenant:invite", () => {
    expect(authorize(ctx("owner"), "tenant:settings")).toBe(true);
    expect(authorize(ctx("owner"), "tenant:invite")).toBe(true);
  });
  it("admin can invite, viewer cannot", () => {
    expect(authorize(ctx("admin"), "tenant:invite")).toBe(true);
    expect(authorize(ctx("viewer"), "tenant:invite")).toBe(false);
  });
  it("member can create project, viewer cannot", () => {
    expect(authorize(ctx("member"), "project:create")).toBe(true);
    expect(authorize(ctx("viewer"), "project:create")).toBe(false);
  });
  it("viewer can read project", () => {
    expect(authorize(ctx("viewer"), "project:read")).toBe(true);
  });
  it("canManageProjects requires at least member", () => {
    expect(canManageProjects(ctx("owner"))).toBe(true);
    expect(canManageProjects(ctx("member"))).toBe(true);
    expect(canManageProjects(ctx("viewer"))).toBe(false);
  });
  it("canReadProjects allows viewer", () => {
    expect(canReadProjects(ctx("viewer"))).toBe(true);
  });
  it("stakeholder is portal-only and receives no internal dashboard privileges", () => {
    const stakeholder = ctx("stakeholder");
    expect(isPortalOnlyStakeholderRole(stakeholder)).toBe(true);
    expect(canReadProjects(stakeholder)).toBe(false);
    expect(canManageProjects(stakeholder)).toBe(false);
    expect(authorize(stakeholder, "admin:read")).toBe(false);
    expect(authorize(stakeholder, "media:read")).toBe(false);
  });
});
