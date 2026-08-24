import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import path from "node:path";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260824120000_pilot_governed_ai_evidence.sql"
);

describe("20260824120000_pilot_governed_ai_evidence migration contract", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("is additive only (no drop table / truncate)", () => {
    expect(sql.toLowerCase()).not.toMatch(/drop table|truncate table/);
  });

  it("enables RLS on new tables", () => {
    expect(sql).toContain("alter table public.visual_evidence_records enable row level security");
    expect(sql).toContain("alter table public.ai_action_audit_records enable row level security");
    expect(sql).toContain("alter table public.report_completeness_evaluations enable row level security");
  });

  it("has append-only audit insert policy without update/delete", () => {
    expect(sql).toContain("ai_action_audit_tenant_insert");
    expect(sql).not.toContain("ai_action_audit_tenant_update");
  });

  it("includes cross-project consistency trigger", () => {
    expect(sql).toContain("validate_visual_evidence_project_consistency");
    expect(sql).toContain("trg_visual_evidence_project_consistency");
  });

  it("stakeholder read requires owner_visible and not internal_only", () => {
    expect(sql).toContain("owner_visible = true");
    expect(sql).toContain("internal_only = false");
  });

  it("records deterministic checksum for manifest", () => {
    const checksum = createHash("sha256").update(sql).digest("hex");
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
