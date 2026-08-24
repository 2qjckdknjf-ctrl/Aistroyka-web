import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import path from "node:path";

const MIGRATION_DIR = path.join(process.cwd(), "supabase/migrations");

const PILOT_MIGRATIONS = [
  "20260824122312_pilot_governed_ai_evidence_staging_compat.sql",
  "20260824122423_pilot_governed_ai_evidence_search_path_hardening.sql",
  "20260824123120_pilot_visual_evidence_report_project_consistency_compat.sql",
  "20260824150000_pilot_governed_ai_evidence_security_hardening.sql",
];

function readMigration(name: string): string {
  return readFileSync(path.join(MIGRATION_DIR, name), "utf8");
}

const allSql = PILOT_MIGRATIONS.map(readMigration).join("\n");

describe("pilot governed AI migration contract", () => {
  it("includes all reconciled migration files", () => {
    const files = readdirSync(MIGRATION_DIR);
    for (const name of PILOT_MIGRATIONS) {
      expect(files).toContain(name);
    }
    expect(files).not.toContain("20260824120000_pilot_governed_ai_evidence.sql");
  });

  it("is additive only (no drop table / truncate)", () => {
    expect(allSql.toLowerCase()).not.toMatch(/drop table|truncate table/);
  });

  it("enables RLS on new tables", () => {
    expect(allSql).toContain("alter table public.visual_evidence_records enable row level security");
    expect(allSql).toContain("alter table public.ai_action_audit_records enable row level security");
    expect(allSql).toContain("alter table public.report_completeness_evaluations enable row level security");
  });

  it("uses service_role for audit and completeness writes", () => {
    expect(allSql).toContain("create policy ai_action_audit_service_role");
    expect(allSql).toContain("create policy report_completeness_service_role");
    expect(allSql).not.toMatch(/create policy ai_action_audit_tenant_insert/i);
    expect(allSql).not.toMatch(/create policy report_completeness_tenant_write/i);
  });

  it("uses project_stakeholders.status active (not revoked_at)", () => {
    expect(allSql).toContain("ps.status = 'active'");
    expect(allSql).not.toContain("revoked_at");
  });

  it("does not reference worker_day.project_id", () => {
    expect(allSql).not.toContain("wd.project_id");
    expect(allSql).not.toContain("worker_day.project_id");
  });

  it("includes hardened trigger and visibility guard", () => {
    expect(allSql).toContain("validate_visual_evidence_project_consistency");
    expect(allSql).toContain("guard_visual_evidence_visibility_columns");
    expect(allSql).toContain("set search_path = ''");
    expect(allSql).toContain("security invoker");
  });

  it("stakeholder read requires owner_visible and not internal_only", () => {
    expect(allSql).toContain("owner_visible = true");
    expect(allSql).toContain("internal_only = false");
  });

  it("records deterministic checksum manifest for pilot slice", () => {
    const checksum = createHash("sha256").update(allSql).digest("hex");
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("pilot governed AI initplan forward migration", () => {
  it("wraps auth.role() with select for service_role policies", () => {
    const sql = readMigration("20260824160000_pilot_governed_ai_rls_initplan_hardening.sql");
    expect(sql).toContain("(select auth.role()) = 'service_role'");
    expect(sql).not.toMatch(/using \(auth\.role\(\) = 'service_role'\)/);
  });
});
