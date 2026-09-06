import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260810110000_harden_service_requests_assignments_sync_cursors.sql"
);

describe("service requests / task assignments / sync cursors RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines writer helper that excludes viewer roles", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(
      /create or replace function public\.is_internal_tenant_writer_for_tenant[\s\S]{0,800}?'viewer'/
    );
  });

  it("scopes service request writes to manage cohort + tenant match", () => {
    expect(sql).toMatch(
      /project_service_requests_write_internal_insert[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_service_requests_write_internal_delete[\s\S]{0,200}?can_manage_project_membership/
    );
    expect(sql).toMatch(
      /project_service_request_events_insert_internal[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).not.toMatch(
      /create policy project_service_requests_write_internal_delete on public\.project_service_requests[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    // Portal stakeholder insert policy must remain (not dropped by this migration).
    expect(sql).not.toMatch(/drop policy if exists project_service_requests_insert_portal/);
  });

  it("blocks viewer writes on task_assignments while keeping reader select", () => {
    expect(sql).toMatch(
      /task_assignments_select_internal[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /task_assignments_write_internal_insert[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /task_assignments_write_internal_delete[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy task_assignments_write_internal_delete on public\.task_assignments[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });

  it("binds sync_cursors reads and writes to auth.uid()", () => {
    expect(sql).toMatch(
      /sync_cursors_select_own[\s\S]{0,250}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /sync_cursors_write_own_insert[\s\S]{0,250}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /sync_cursors_write_own_delete[\s\S]{0,250}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toContain("drop policy if exists sync_cursors_internal");
  });
});
