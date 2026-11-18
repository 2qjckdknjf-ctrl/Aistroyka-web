import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906114000_harden_aftercare_assignments_sync_cursors.sql"
);

describe("aftercare / task assignments / sync cursors RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("scopes internal aftercare mutations to project managers and tenant match", () => {
    expect(sql).toMatch(
      /project_service_requests_write_internal_insert[\s\S]{0,350}?can_manage_project_membership[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_service_requests_write_internal_update[\s\S]{0,350}?can_manage_project_membership[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_service_requests_write_internal_delete[\s\S]{0,250}?can_manage_project_membership/
    );
  });

  it("preserves portal service-request creation and a narrowly scoped initial audit event", () => {
    expect(sql).not.toContain("drop policy if exists project_service_requests_insert_portal");
    expect(sql).toContain("project_service_request_events_insert_portal_initial");
    expect(sql).toContain("is_portal_stakeholder_for_project(project_id)");
    expect(sql).toContain("actor_user_id = (select auth.uid())");
    expect(sql).toContain("from_status is null");
    expect(sql).toContain("to_status = 'reported'");
    expect(sql).toContain("sr.created_by = (select auth.uid())");
    expect(sql).toContain("sr.status = 'reported'");
  });

  it("keeps task assignment reads but excludes viewers from writes and binds task tenant", () => {
    expect(sql).toMatch(
      /task_assignments_select_internal[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /task_assignments_write_internal_insert[\s\S]{0,400}?is_internal_tenant_writer_for_tenant[\s\S]{0,350}?worker_tasks[\s\S]{0,200}?wt\.tenant_id = task_assignments\.tenant_id/
    );
    expect(sql).toMatch(
      /task_assignments_write_internal_update[\s\S]{0,450}?is_internal_tenant_writer_for_tenant[\s\S]{0,350}?worker_tasks/
    );
    expect(sql).toMatch(
      /task_assignments_write_internal_delete[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("binds all sync cursor reads/writes to the authenticated user's own rows", () => {
    expect(sql).toContain("drop policy if exists sync_cursors_internal");
    for (const policy of [
      "sync_cursors_select_own",
      "sync_cursors_write_own_insert",
      "sync_cursors_write_own_update",
      "sync_cursors_write_own_delete",
    ]) {
      expect(sql).toMatch(
        new RegExp(`${policy}[\\s\\S]{0,450}?user_id = \\(select auth\\.uid\\(\\)\\)`)
      );
    }
  });
});
