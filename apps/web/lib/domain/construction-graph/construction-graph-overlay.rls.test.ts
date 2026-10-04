import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261003120000_construction_graph_overlay.sql"),
  "utf8"
);

describe("construction graph overlay uniqueness", () => {
  it("scopes node uniqueness by tenant, project, source table, and source id", () => {
    expect(sql).toMatch(/unique \(tenant_id, project_id, source_table, source_id\)/);
    expect(sql).not.toMatch(/unique \(tenant_id, source_table, source_id\)/);
  });

  it("reads overlay rows through can_read_project_membership", () => {
    expect(sql).toMatch(/can_read_project_membership\(tenant_id, project_id\)/);
  });
});
