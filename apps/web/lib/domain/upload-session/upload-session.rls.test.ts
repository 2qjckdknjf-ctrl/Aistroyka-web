import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "../../../supabase/migrations/20260726112000_restrict_upload_session_updates.sql"
  ),
  "utf8"
);

describe("upload_sessions update RLS", () => {
  it("drops the broad FOR ALL internal policy", () => {
    expect(migration).toContain("drop policy if exists upload_sessions_internal");
    expect(migration).toContain("create policy upload_sessions_select_internal");
    expect(migration).toContain("create policy upload_sessions_insert_own");
    expect(migration).toContain("create policy upload_sessions_update_own");
  });

  it("requires session ownership on insert and update", () => {
    expect(migration).toContain("user_id = (select auth.uid())");
    expect(migration).toMatch(
      /create policy upload_sessions_update_own[\s\S]*user_id = \(select auth\.uid\(\)\)/
    );
  });

  it("revokes ownership and purpose column updates from authenticated", () => {
    expect(migration).toContain(
      "revoke update on table public.upload_sessions from authenticated"
    );
    expect(migration).toContain(
      "grant update (status, object_path, mime_type, size_bytes, archived_at) on public.upload_sessions to authenticated"
    );
    expect(migration).not.toMatch(
      /grant update \([^)]*user_id[^)]*\) on public\.upload_sessions to authenticated/
    );
    expect(migration).not.toMatch(
      /grant update \([^)]*purpose[^)]*\) on public\.upload_sessions to authenticated/
    );
  });
});
