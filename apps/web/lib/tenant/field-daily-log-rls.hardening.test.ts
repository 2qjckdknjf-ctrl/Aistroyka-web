import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CREATE = resolve(
  __dirname,
  "../../supabase/migrations/20260916120000_field_daily_logs.sql"
);
const HARDEN = resolve(
  __dirname,
  "../../supabase/migrations/20260920110000_harden_field_daily_logs_rls.sql"
);

describe("field daily log RLS hardening", () => {
  const createSql = readFileSync(CREATE, "utf8");
  const sql = readFileSync(HARDEN, "utf8");

  it("replaces the original tenant-wide FOR ALL policy", () => {
    expect(createSql).toContain("create policy field_daily_logs_tenant_member");
    expect(createSql).toMatch(/for all using/);
    expect(sql).toContain("drop policy if exists field_daily_logs_tenant_member");
  });

  it("keeps internal reads and restricts writes to the writer cohort", () => {
    expect(sql).toMatch(
      /field_daily_logs_select_internal[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /field_daily_logs_insert_internal[\s\S]{0,350}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /field_daily_logs_update_internal[\s\S]{0,350}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toContain("project_belongs_to_tenant");
  });

  it("blocks confirmed-row edits and authenticated deletes", () => {
    expect(sql).toMatch(
      /field_daily_logs_insert_internal[\s\S]{0,400}?status = 'draft'/
    );
    expect(sql).toMatch(
      /field_daily_logs_update_internal[\s\S]{0,250}?status = 'draft'[\s\S]{0,250}?status in \('draft', 'confirmed'\)/
    );
    expect(sql).toContain("drop policy if exists field_daily_logs_delete_internal");
    expect(sql).not.toMatch(/create policy field_daily_logs_delete_internal/);
    expect(sql).toContain("confirmed field daily logs cannot be updated");
  });

  it("keeps tenant/created-by identity immutable on client updates", () => {
    expect(sql).toContain("enforce_field_daily_log_identity_immutable");
    expect(sql).toContain("new.tenant_id is distinct from old.tenant_id");
    expect(sql).toContain("new.created_by is distinct from old.created_by");
  });
});
