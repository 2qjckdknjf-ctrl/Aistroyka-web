import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261004180000_create_analysis_job_request_key.sql"),
  "utf8"
);

describe("create_analysis_job request_key migration", () => {
  it("adds an optional p_request_key argument with a null default", () => {
    expect(sql).toMatch(/p_request_key text default null/);
    expect(sql).toMatch(/insert into public\.analysis_jobs/);
    expect(sql).toMatch(/request_key,/);
  });

  it("reuses or binds an active media job instead of inserting a second row", () => {
    expect(sql).toMatch(/status in \('pending', 'queued', 'processing'\)/);
    expect(sql).toMatch(/and request_key is null/);
    expect(sql).toMatch(/Idempotency key already used/);
  });

  it("re-reads the active row when a concurrent request_key bind wins", () => {
    expect(sql).toMatch(/v_active_id uuid/);
    expect(sql).toMatch(/Concurrent bind can win the predicate/);
    expect(sql).toMatch(/where id = v_active_id/);
    expect(sql).toMatch(/if new_job\.request_key is distinct from v_request_key/);
  });

  it("does not swallow intentional idempotency unique_violations", () => {
    expect(sql).toMatch(/if sqlerrm = 'Idempotency key already used' then/);
    expect(sql).toMatch(/new_job\.request_key is distinct from v_request_key/);
  });

  it("keeps execute on service_role only", () => {
    expect(sql).toMatch(/drop function if exists public\.create_analysis_job\(uuid, uuid, text\)/);
    expect(sql).toMatch(/revoke all on function public\.create_analysis_job\(uuid, uuid, text, text\)/);
    expect(sql).toMatch(/grant execute on function public\.create_analysis_job\(uuid, uuid, text, text\) to service_role/);
    expect(sql).not.toMatch(/to authenticated/);
  });
});
