import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "../../../supabase/migrations/20260720110728_restrict_task_message_updates.sql"
  ),
  "utf8"
);

describe("task_messages update RLS", () => {
  it("limits authenticated updates to the soft-delete column", () => {
    expect(migration).toContain(
      "revoke update on table public.task_messages from authenticated"
    );
    expect(migration).toContain(
      "grant update (deleted_at) on public.task_messages to authenticated"
    );
  });

  it("does not grant tenant members manager-wide update access", () => {
    const policy = migration.slice(migration.indexOf("create policy task_messages_update"));

    expect(policy).toContain("sender_user_id = (select auth.uid())");
    expect(policy).toContain("tm.role in ('owner', 'admin')");
    expect(policy).not.toContain("'member'");
  });
});
