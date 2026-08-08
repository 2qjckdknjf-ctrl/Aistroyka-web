import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260808110000_harden_worker_ops_and_project_ops_viewer_writes.sql"
);

describe("worker ops / project ops viewer RLS hardening migration", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines writer helper that excludes viewer roles", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(
      /create or replace function public\.is_internal_tenant_writer_for_tenant[\s\S]{0,800}?'viewer'/
    );
  });

  it("blocks viewer writes on worker_reports and worker_report_media", () => {
    expect(sql).toMatch(
      /create policy worker_reports_write_internal_insert on public\.worker_reports[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /create policy worker_reports_write_internal_delete on public\.worker_reports[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy worker_reports_write_internal_delete on public\.worker_reports[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /create policy worker_report_media_write_internal_delete on public\.worker_report_media[\s\S]{0,300}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("requires writer + tenant match for worker_tasks and worker_day when project set", () => {
    expect(sql).toMatch(
      /worker_tasks_write_internal_insert[\s\S]{0,400}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /worker_day_write_internal_insert[\s\S]{0,400}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
  });

  it("hardens issues, risks, and handover writes against viewers", () => {
    expect(sql).toMatch(
      /project_issues_write_internal_insert[\s\S]{0,300}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_risks_write_internal_insert[\s\S]{0,300}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_handover_write_internal_update[\s\S]{0,300}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_handover_events_insert_internal[\s\S]{0,300}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy project_handover_write_internal_update on public\.project_handover[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });
});
