import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261003140000_field_daily_logs_server_confirm_stamp.sql"
  ),
  "utf8"
);

describe("field_daily_logs confirmation provenance migration", () => {
  it("overwrites confirmed_by/at from auth.uid()/now on draft→confirmed", () => {
    expect(sql).toMatch(/old\.status = 'draft' and new\.status = 'confirmed'/);
    expect(sql).toMatch(/new\.confirmed_by := auth\.uid\(\)/);
    expect(sql).toMatch(/new\.confirmed_at := timezone\('utc', now\(\)\)/);
  });

  it("strips confirmation metadata from authenticated draft inserts", () => {
    expect(sql).toMatch(/if tg_op = 'INSERT'/);
    expect(sql).toMatch(/new\.status = 'draft'/);
    expect(sql).toMatch(/new\.confirmed_by := null/);
    expect(sql).toMatch(/new\.confirmed_at := null/);
    expect(sql).toMatch(/before insert or update on public\.field_daily_logs/);
  });

  it("keeps confirmed rows immutable and does not weaken insert to non-draft", () => {
    expect(sql).toMatch(/confirmed field daily logs cannot be updated/);
    expect(sql).toMatch(/and status = 'draft'/);
    expect(sql).toMatch(/and confirmed_by is null/);
    expect(sql).toMatch(/and confirmed_at is null/);
  });

  it("does not trust client-supplied confirmation columns", () => {
    expect(sql).not.toMatch(/new\.confirmed_by := old\.confirmed_by/);
    expect(sql).toMatch(/Never persist client-supplied confirmed_by/);
  });
});
