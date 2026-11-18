import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906121000_harden_idempotency_ai_chat_notifications_plan_directory.sql"
);

describe("Wave 6 idempotency/chat/notifications/plan/directory RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("makes idempotency keys service-role only for direct PostgREST", () => {
    expect(sql).toContain("drop policy if exists idempotency_internal");
    expect(sql).toContain("drop policy if exists idempotency_tenant");
    expect(sql).not.toMatch(/create policy idempotency_/);
  });

  it("scopes AI threads to the caller's own project-accessible thread and removes delete", () => {
    expect(sql).toMatch(
      /ai_chat_threads_select_own_project[\s\S]{0,650}?created_by = \(select auth\.uid\(\)\)[\s\S]{0,350}?can_read_project_membership\(tenant_id, project_id\)/
    );
    expect(sql).toMatch(
      /ai_chat_threads_insert_own_project[\s\S]{0,700}?created_by = \(select auth\.uid\(\)\)[\s\S]{0,350}?can_read_project_membership\(tenant_id, project_id\)/
    );
    expect(sql).toContain("drop policy if exists ai_chat_threads_delete_internal");
    expect(sql).not.toMatch(/create policy ai_chat_threads_delete/);
  });

  it("keeps AI messages append-only and bound to the caller's own project thread", () => {
    expect(sql).toMatch(
      /ai_chat_messages_select_own_project[\s\S]{0,900}?t\.created_by = \(select auth\.uid\(\)\)[\s\S]{0,350}?can_read_project_membership\(t\.tenant_id, t\.project_id\)/
    );
    expect(sql).toMatch(
      /ai_chat_messages_insert_own_project[\s\S]{0,900}?t\.created_by = \(select auth\.uid\(\)\)[\s\S]{0,350}?can_read_project_membership\(t\.tenant_id, t\.project_id\)/
    );
    expect(sql).not.toMatch(/create policy ai_chat_messages_update/);
    expect(sql).not.toMatch(/create policy ai_chat_messages_delete/);
  });

  it("makes manager inbox private, constrains recipients, and permits read_at-only updates", () => {
    expect(sql).toMatch(
      /manager_notifications_select_own[\s\S]{0,400}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /manager_notifications_insert_internal[\s\S]{0,650}?is_internal_tenant_writer_for_tenant\(tenant_id\)[\s\S]{0,300}?notification_recipient_belongs_to_tenant\(tenant_id, user_id\)/
    );
    expect(sql).toContain("enforce_manager_notification_read_only_update");
    expect(sql).toContain("manager notification content is immutable");
    expect(sql).not.toMatch(/create policy manager_notifications_delete/);
  });

  it("keeps plan state readable but excludes viewers from plan writes", () => {
    expect(sql).toMatch(
      /plan_fit_recommendations_select[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /plan_fit_recommendations_insert[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /workspace_plan_state_select[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /workspace_plan_state_insert[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /workspace_plan_state_update[\s\S]{0,450}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("splits contractor-directory reader and writer cohorts", () => {
    expect(sql).toMatch(
      /tenant_contractor_profiles_select_internal[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /tenant_contractor_profiles_insert_internal[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /tenant_contractor_profiles_update_internal[\s\S]{0,450}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /tenant_contractor_profiles_delete_internal[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("binds stakeholder discussion entries to manager/portal scope and caller identity", () => {
    expect(sql).toMatch(
      /stakeholder_discussion_entries_insert_internal[\s\S]{0,500}?can_manage_project_membership\(tenant_id, project_id\)[\s\S]{0,300}?author_user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /stakeholder_discussion_entries_insert_portal[\s\S]{0,500}?is_portal_stakeholder_for_project\(project_id\)[\s\S]{0,300}?author_user_id = \(select auth\.uid\(\)\)/
    );
  });
});
