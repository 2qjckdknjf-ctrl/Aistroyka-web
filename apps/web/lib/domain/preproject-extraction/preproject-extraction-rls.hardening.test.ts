import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261028170000_preproject_extraction_observations.sql"),
  "utf8"
);

describe("AIS-CLIENT-005A preproject extraction RLS hardening", () => {
  it("uses internal-writer helpers only (no stakeholder/anon select)", () => {
    expect(sql).toContain("preproject_extraction_runs");
    expect(sql).toContain("preproject_observations");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/revoke all on table public\.preproject_extraction_runs from public, anon/i);
    expect(sql).toMatch(/revoke all on table public\.preproject_observations from public, anon/i);
    expect(sql).not.toMatch(/stakeholder/);
  });
});
