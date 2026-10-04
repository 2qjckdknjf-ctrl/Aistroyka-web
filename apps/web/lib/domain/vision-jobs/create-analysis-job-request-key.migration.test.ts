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

  it("keeps execute on service_role only", () => {
    expect(sql).toMatch(/drop function if exists public\.create_analysis_job\(uuid, uuid, text\)/);
    expect(sql).toMatch(/revoke all on function public\.create_analysis_job\(uuid, uuid, text, text\)/);
    expect(sql).toMatch(/grant execute on function public\.create_analysis_job\(uuid, uuid, text, text\) to service_role/);
    expect(sql).not.toMatch(/to authenticated/);
  });
});
