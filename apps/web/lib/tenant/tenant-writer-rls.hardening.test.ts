import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    __dirname,
    "../../supabase/migrations/20260906104000_project_write_authorization_hardening.sql"
  ),
  "utf8"
);

describe("tenant reader/writer RLS separation", () => {
  it("defines a writer cohort that excludes viewer and stakeholder", () => {
    expect(sql).toContain("create or replace function public.is_internal_tenant_writer_for_tenant");
    expect(sql).toContain("tm.role in ('owner', 'admin', 'member')");
    expect(sql).not.toMatch(/tm\.role in \([^)]*viewer[^)]*\)/);
    expect(sql).not.toMatch(/tm\.role in \([^)]*stakeholder[^)]*\)/);
  });

  it("uses the writer helper for project row mutations", () => {
    expect(sql).toMatch(
      /projects_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /projects_write_internal_update[\s\S]*is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /projects_write_internal_delete[\s\S]*is_internal_tenant_writer_for_tenant/
    );
  });

  it("uses the writer helper for core project-content mutations", () => {
    for (const policy of [
      "project_documents_write_internal_insert",
      "project_milestones_write_internal_insert",
      "project_client_requests_write_internal_insert",
      "project_handover_write_internal_insert",
      "project_issues_write_internal_insert",
      "project_risks_write_internal_insert",
    ]) {
      expect(sql).toMatch(
        new RegExp(`${policy}[\\s\\S]*?is_internal_tenant_writer_for_tenant`)
      );
    }
  });

  it("keeps Worker operational writes for member but not viewer", () => {
    expect(sql).toMatch(
      /worker_reports_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /worker_tasks_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /worker_report_media_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant/
    );
  });
});
