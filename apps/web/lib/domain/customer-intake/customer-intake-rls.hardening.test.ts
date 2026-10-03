import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261003170000_customer_intake_drafts.sql"),
  "utf8"
);

describe("customer intake draft RLS", () => {
  it("does not grant tenant-wide select from generic tenant_members", () => {
    expect(sql).not.toMatch(
      /customer_intake_drafts_select[\s\S]*?tenant_id in \(select tm\.tenant_id from public\.tenant_members/
    );
  });

  it("lets internal readers use the canonical internal predicate", () => {
    expect(sql).toMatch(
      /customer_intake_drafts_select[\s\S]*is_internal_tenant_reader_for_tenant\(tenant_id\)/
    );
  });

  it("limits portal/customer select to the creator with current access", () => {
    expect(sql).toMatch(/customer_intake_drafts_select[\s\S]*created_by = \(select auth\.uid\(\)\)/);
    expect(sql).toMatch(/customer_intake_drafts_select[\s\S]*customer_intake_has_current_tenant_access\(tenant_id\)/);
    expect(sql).toMatch(/customer_intake_drafts_select[\s\S]*customer_intake_project_scope_ok\(project_id, tenant_id\)/);
  });

  it("requires current membership and project/tenant scope on insert and update", () => {
    for (const policy of ["customer_intake_drafts_insert", "customer_intake_drafts_update"]) {
      expect(sql).toMatch(new RegExp(`${policy}[\\s\\S]*created_by = \\(select auth\\.uid\\(\\)\\)`));
      expect(sql).toMatch(new RegExp(`${policy}[\\s\\S]*customer_intake_has_current_tenant_access\\(tenant_id\\)`));
      expect(sql).toMatch(new RegExp(`${policy}[\\s\\S]*customer_intake_project_scope_ok\\(project_id, tenant_id\\)`));
    }
    expect(sql).toMatch(/customer_intake_drafts_update[\s\S]*with check \(/);
  });

  it("binds non-null project_id to the row tenant and portal/internal access", () => {
    expect(sql).toMatch(/project_belongs_to_tenant\(p_project_id, p_tenant_id\)/);
    expect(sql).toMatch(/is_portal_stakeholder_for_project\(p_project_id\)/);
  });

  it("makes tenant_id and created_by immutable after insert", () => {
    expect(sql).toMatch(/customer_intake_drafts\.tenant_id is immutable/);
    expect(sql).toMatch(/customer_intake_drafts\.created_by is immutable/);
    expect(sql).toMatch(/before update on public\.customer_intake_drafts/);
  });
});
