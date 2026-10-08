import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261003145000_analysis_jobs_attempt_count.sql"),
  "utf8"
);

describe("analysis_jobs attempt_count", () => {
  it("adds a persisted attempt counter incremented only on live failure", () => {
    expect(sql).toMatch(/add column if not exists attempt_count integer not null default 0/);
    expect(sql).toMatch(/record_analysis_job_failure/);
    expect(sql).toMatch(/attempt_count = attempt_count \+ 1/);
    expect(sql).toMatch(/status in \('pending', 'queued', 'processing'\)/);
    expect(sql).toMatch(
      /revoke all on function public\.record_analysis_job_failure\(uuid, text, text\) from public, anon, authenticated/
    );
    expect(sql).toMatch(/if auth\.role\(\) is distinct from 'service_role'/);
    expect(sql).toMatch(/grant execute on function public\.record_analysis_job_failure\(uuid, text, text\) to service_role/);
    expect(sql).not.toMatch(/grant execute[^\n]*to authenticated/);
  });
});
