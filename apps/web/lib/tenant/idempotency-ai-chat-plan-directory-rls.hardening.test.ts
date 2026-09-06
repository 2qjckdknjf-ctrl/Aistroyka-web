import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260812110000_harden_idempotency_ai_chat_notifications_plan_directory.sql"
);

describe("idempotency / ai chat / notifications / plan / directory RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines writer helper that excludes viewer roles", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(
      /create or replace function public\.is_internal_tenant_writer_for_tenant[\s\S]{0,800}?'viewer'/
    );
  });

  it("removes authenticated access to idempotency_keys", () => {
    expect(sql).toContain("drop policy if exists idempotency_internal");
    expect(sql).toContain("drop policy if exists idempotency_tenant");
    expect(sql).not.toMatch(
      /create policy\s+\w+\s+on public\.idempotency_keys/
    );
  });

  it("blocks authenticated DELETE on ai_chat tables while keeping reader chat writes", () => {
    expect(sql).toMatch(
      /ai_chat_threads_select_internal[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /ai_chat_threads_insert_internal[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /ai_chat_messages_insert_internal[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).not.toMatch(
      /create policy ai_chat_threads_delete_internal/
    );
    expect(sql).not.toMatch(
      /create policy ai_chat_messages_delete_internal/
    );
    expect(sql).toContain("drop policy if exists ai_chat_threads_tenant");
    expect(sql).toContain("drop policy if exists ai_chat_messages_tenant");
  });

  it("scopes manager_notifications to own inbox and writer inserts", () => {
    expect(sql).toMatch(
      /manager_notifications_select_own[\s\S]{0,250}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /manager_notifications_update_own[\s\S]{0,250}?user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /manager_notifications_insert_internal[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy manager_notifications_delete/
    );
    expect(sql).toContain("drop policy if exists manager_notifications_internal");
  });

  it("requires writers for plan-fit and contractor directory mutations", () => {
    expect(sql).toMatch(
      /workspace_plan_state_insert[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /workspace_plan_state_update[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /plan_fit_recommendations_insert[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /tenant_contractor_profiles_delete_internal[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy workspace_plan_state_insert on public\.workspace_plan_state[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });

  it("binds discussion entry inserts to manage/portal cohort + author", () => {
    expect(sql).toMatch(
      /stakeholder_discussion_entries_insert_internal[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?author_user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /stakeholder_discussion_entries_insert_portal[\s\S]{0,250}?author_user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toContain(
      "drop policy if exists stakeholder_discussion_entries_insert_combined"
    );
  });
});
