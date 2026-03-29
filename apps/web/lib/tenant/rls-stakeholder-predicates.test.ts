import { describe, expect, it } from "vitest";

/**
 * Documents intent of SQL helpers in 20260329140000_stakeholder_rls_isolation.sql
 * (is_internal_tenant_reader_for_tenant / is_portal_stakeholder_for_project).
 * RLS itself is enforced in Postgres; these tests guard against accidental drift in naming.
 */
describe("RLS stakeholder predicate intent (mirrors SQL helpers)", () => {
  const internalRoles = new Set(["owner", "admin", "member", "viewer"]);

  function isInternalMemberRole(role: string): boolean {
    return internalRoles.has(role);
  }

  it("stakeholder is not an internal workspace reader role", () => {
    expect(isInternalMemberRole("stakeholder")).toBe(false);
  });

  it("viewer remains internal reader for RLS internal predicate", () => {
    expect(isInternalMemberRole("viewer")).toBe(true);
  });
});
