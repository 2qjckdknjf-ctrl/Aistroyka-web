import { describe, expect, it } from "vitest";
import { pickPrimaryTenantMembership } from "./tenant-membership-priority";
import { isPortalOnlyTenantRole } from "./tenant.policy";

describe("pickPrimaryTenantMembership", () => {
  it("returns null for empty or invalid rows", () => {
    expect(pickPrimaryTenantMembership([])).toBeNull();
    expect(pickPrimaryTenantMembership([{ tenant_id: "t1", role: "unknown" }])).toBeNull();
    expect(pickPrimaryTenantMembership([{ tenant_id: "", role: "member" }])).toBeNull();
  });

  it("keeps stakeholder-only users on the portal tenant", () => {
    expect(
      pickPrimaryTenantMembership([{ tenant_id: "portal", role: "stakeholder" }])
    ).toEqual({ tenant_id: "portal", role: "stakeholder" });
  });

  it("prefers an internal membership even when stakeholder is listed first", () => {
    expect(
      pickPrimaryTenantMembership([
        { tenant_id: "portal", role: "stakeholder" },
        { tenant_id: "ops", role: "member" },
      ])
    ).toEqual({ tenant_id: "ops", role: "member" });
  });

  it("prefers the strongest internal role across workspaces", () => {
    expect(
      pickPrimaryTenantMembership([
        { tenant_id: "a", role: "viewer" },
        { tenant_id: "b", role: "admin" },
        { tenant_id: "c", role: "stakeholder" },
        { tenant_id: "d", role: "member" },
      ])
    ).toEqual({ tenant_id: "b", role: "admin" });
  });

  it("treats tenant_members owner as internal, not portal-only", () => {
    expect(
      pickPrimaryTenantMembership([
        { tenant_id: "portal", role: "stakeholder" },
        { tenant_id: "ops", role: "owner" },
      ])
    ).toEqual({ tenant_id: "ops", role: "owner" });
  });

  it("keeps dual-role contractors off the portal-only dashboard gate", () => {
    const primary = pickPrimaryTenantMembership([
      { tenant_id: "portal", role: "stakeholder" },
      { tenant_id: "ops", role: "member" },
    ]);
    expect(isPortalOnlyTenantRole(primary?.role)).toBe(false);
    expect(isPortalOnlyTenantRole("stakeholder")).toBe(true);
  });
});
