import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906124500_harden_ai_chat_message_role_provenance.sql"
);
const STREAM_ROUTE = resolve(
  __dirname,
  "../../app/api/v1/projects/[id]/copilot/chat/stream/route.ts"
);
const ADMIN_CLIENT = resolve(__dirname, "../supabase/admin.ts");

const sql = readFileSync(MIGRATION, "utf8").toLowerCase();
const route = readFileSync(STREAM_ROUTE, "utf8");
const adminClient = readFileSync(ADMIN_CLIENT, "utf8");

describe("AI chat message role provenance hardening", () => {
  it("restricts authenticated message inserts to role=user", () => {
    expect(sql).toContain(
      "drop policy if exists ai_chat_messages_insert_own_project on public.ai_chat_messages"
    );
    expect(sql).toContain("create policy ai_chat_messages_insert_own_project");
    expect(sql).toContain("for insert");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("role = 'user'");
  });

  it("preserves own-thread and authorized-project checks", () => {
    expect(sql).toContain("t.id = ai_chat_messages.thread_id");
    expect(sql).toContain("t.tenant_id = ai_chat_messages.tenant_id");
    expect(sql).toContain("t.project_id = ai_chat_messages.project_id");
    expect(sql).toContain("t.created_by = (select auth.uid())");
    expect(sql).toContain("public.can_read_project_membership(t.tenant_id, t.project_id)");
    expect(sql).toContain("public.project_belongs_to_tenant(t.project_id, t.tenant_id)");
  });

  it("persists user messages with the authenticated client", () => {
    expect(route).toContain(
      'const { error: userMsgErr } = await supabase.from("ai_chat_messages").insert({'
    );
    expect(route).toContain('role: "user"');
  });

  it("persists assistant messages only with the already-required admin client", () => {
    expect(route).toContain("const admin = getAdminClient() as SupabaseClient | null;");
    expect(route).toContain(
      'const { data: inserted, error: insertErr } = await admin\n            .from("ai_chat_messages")'
    );
    expect(route).toContain('role: "assistant"');
    expect(route).not.toContain(
      'const { data: inserted, error: insertErr } = await supabase\n            .from("ai_chat_messages")'
    );
  });

  it("keeps ungenerated relation typing scoped to the Copilot route", () => {
    expect(adminClient).toContain('import { createClient } from "@supabase/supabase-js"');
    expect(adminClient).toContain("let adminClient: ReturnType<typeof createClient> | null = null");
    expect(adminClient).toContain(
      "export function getAdminClient(): ReturnType<typeof createClient> | null"
    );
    expect(adminClient).not.toContain("type SupabaseClient");
    expect(route).toContain('import type { SupabaseClient } from "@supabase/supabase-js"');
    expect(route).toContain("getAdminClient() as SupabaseClient | null");
  });
});
