import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    __dirname,
    "../../supabase/migrations/20260906110000_project_ops_tenant_consistency.sql"
  ),
  "utf8"
);

describe("project ops tenant/project consistency", () => {
  it("requires tenant match for worker task/day project references", () => {
    expect(sql).toMatch(
      /worker_tasks_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /worker_day_write_internal_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*project_belongs_to_tenant/
    );
  });

  it("requires tenant match for issues, risks and handover writes", () => {
    for (const policy of [
      "project_issues_write_internal_insert",
      "project_risks_write_internal_insert",
      "project_handover_write_internal_insert",
      "project_handover_write_internal_update",
      "project_handover_events_insert_internal",
    ]) {
      expect(sql).toMatch(
        new RegExp(`${policy}[\\s\\S]*?is_internal_tenant_writer_for_tenant[\\s\\S]*?project_belongs_to_tenant`)
      );
    }
  });

  it("does not reintroduce reader helper into these write policies", () => {
    expect(sql).not.toContain("is_internal_tenant_reader_for_tenant");
  });
});
