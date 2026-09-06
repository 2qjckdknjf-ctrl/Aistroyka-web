import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906092000_release_hardening_viewer_core_writes.sql"
);

describe("release hardening viewer/core write RLS", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("excludes viewers from project writes and restricts project delete to owner/admin", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toContain("is_tenant_owner_or_admin");
    expect(sql).toMatch(
      /create policy projects_write_internal_insert on public\.projects[\s\S]{0,240}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /create policy projects_write_internal_delete on public\.projects[\s\S]{0,240}?is_tenant_owner_or_admin/
    );
    expect(sql).not.toMatch(
      /create policy projects_write_internal_delete on public\.projects[\s\S]{0,240}?is_internal_tenant_reader_for_tenant/
    );
  });

  it("requires writer plus tenant match for document and milestone writes", () => {
    expect(sql).toMatch(
      /project_documents_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_milestones_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*project_belongs_to_tenant/
    );
  });

  it("scopes customer_estimate writes to project manage cohort and blocks forged decisions", () => {
    expect(sql).toMatch(
      /customer_estimates_insert_internal[\s\S]*can_manage_project_membership[\s\S]*project_belongs_to_tenant/
    );
    expect(sql).toContain("enforce_customer_estimate_decision_via_service");
    expect(sql).toContain("customer_estimates approved/rejected requires service role");
  });

  it("splits jobs FOR ALL and guards authenticated lifecycle updates", () => {
    expect(sql).toContain("drop policy if exists jobs_internal");
    expect(sql).toContain("jobs_select_internal");
    expect(sql).toContain("jobs_insert_internal");
    expect(sql).toContain("enforce_jobs_authenticated_update_guard");
    expect(sql).toContain("jobs lifecycle fields are immutable for authenticated clients");
    expect(sql).toContain("authenticated jobs update may only free dedupe_key on terminal jobs");
  });
});
