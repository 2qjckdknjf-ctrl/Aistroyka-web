import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906091000_release_hardening_project_commercial_rls.sql"
);

describe("release hardening project commercial / proof / membership RLS", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("blocks project_members self-promotion without tenant admin", () => {
    expect(sql).toContain("enforce_project_members_privilege_change");
    expect(sql).toContain("project_members.role change requires tenant owner/admin");
    expect(sql).toContain("role in ('worker', 'contractor', 'manager')");
  });

  it("scopes proof_pack_shares to can_manage_project_membership", () => {
    expect(sql).toContain("drop policy if exists proof_pack_shares_internal");
    expect(sql).toContain("proof_pack_shares_select_manage");
    expect(sql).toMatch(/proof_pack_shares_select_manage[\s\S]*can_manage_project_membership/);
    expect(sql).not.toMatch(
      /create policy proof_pack_shares_internal[\s\S]*is_internal_tenant_reader_for_tenant/
    );
  });

  it("requires manage cohort + tenant match for change order and commercial writes", () => {
    expect(sql).toContain("project_belongs_to_tenant");
    expect(sql).toContain("change_orders_write_internal_insert");
    expect(sql).toContain("project_commercial_items_internal_insert");
    expect(sql).toMatch(
      /change_orders_write_internal_insert[\s\S]*can_manage_project_membership[\s\S]*project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_commercial_items_internal_insert[\s\S]*can_manage_project_membership[\s\S]*project_belongs_to_tenant/
    );
  });

  it("keeps constrained portal open-defect insert while requiring tenant match", () => {
    expect(sql).toContain("is_portal_stakeholder_for_project(project_id)");
    expect(sql).toMatch(
      /project_defects_insert[\s\S]*project_belongs_to_tenant[\s\S]*can_manage_project_membership/
    );
    expect(sql).toContain("assigned_to is null");
  });
});
