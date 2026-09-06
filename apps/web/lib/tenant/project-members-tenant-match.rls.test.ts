import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    __dirname,
    "../../supabase/migrations/20260906105000_project_members_tenant_match.sql"
  ),
  "utf8"
);

describe("project_members tenant/project match", () => {
  it("requires manager authorization and project tenant consistency", () => {
    expect(sql).toContain("drop policy if exists project_members_insert_scoped");
    expect(sql).toContain("create policy project_members_insert_scoped");
    expect(sql).toContain("can_manage_project_membership(tenant_id, project_id)");
    expect(sql).toContain("project_belongs_to_tenant(project_id, tenant_id)");
  });

  it("does not allow authenticated clients to mint project owner through the ordinary role list", () => {
    expect(sql).toContain("role in ('worker', 'contractor', 'manager')");
    expect(sql).not.toContain("role in ('worker', 'contractor', 'manager', 'owner')");
  });
});
