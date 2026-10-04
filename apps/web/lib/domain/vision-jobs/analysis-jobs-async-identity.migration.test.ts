import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261003160000_analysis_jobs_async_identity.sql"),
  "utf8"
);

describe("analysis_jobs async identity migration", () => {
  it("does not add a second attempts column", () => {
    expect(sql).not.toMatch(/add column if not exists attempts\b/);
  });

  it("locks client writes to service_role and select-only RLS", () => {
    expect(sql).toMatch(/drop policy if exists analysis_jobs_tenant/);
    expect(sql).toMatch(/create policy analysis_jobs_select_internal/);
    expect(sql).toMatch(/for select/);
    expect(sql).toMatch(/is_internal_tenant_reader_for_tenant/);
    expect(sql).toMatch(/analysis_jobs writes require service_role/);
    expect(sql).toMatch(/before insert or update/);
  });

  it("rejects INSERT of terminal statuses and keeps completed rows immutable", () => {
    expect(sql).toMatch(/tg_op = 'INSERT'/);
    expect(sql).toMatch(/cannot be inserted in a terminal status/);
    expect(sql).toMatch(/old\.status = 'completed'/);
    expect(sql).toMatch(/completed rows are immutable/);
    expect(sql).not.toMatch(/old\.status in \('completed', 'failed'\)/);
    expect(sql).toMatch(/failed → queued/);
  });
});
