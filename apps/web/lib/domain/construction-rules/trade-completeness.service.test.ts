import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  listTradeCompletenessTemplates,
  parseEvidenceInventory,
  runTradeCompletenessEvaluation,
} from "./trade-completeness.service";

describe("AIS-RULE-015 trade-completeness.service", () => {
  it("lists approved waterproofing template seed", () => {
    const templates = listTradeCompletenessTemplates();
    expect(templates.some((t) => t.id === "trade.waterproofing.wet_area")).toBe(true);
    expect(templates[0]?.status).toBe("approved");
  });

  it("parses inventory snake_case and camelCase", () => {
    const parsed = parseEvidenceInventory([
      { evidence_kind: "contract_scope", status: "present", source_ref: "c1" },
      { evidenceKind: "work_specification", status: "unverified", sourceRef: "w1" },
      { evidence_kind: "not_a_kind", status: "present" },
      { evidence_kind: "measured_quantity", status: "bogus" },
    ]);
    expect(parsed).toEqual([
      { evidenceKind: "contract_scope", status: "present", sourceRef: "c1" },
      { evidenceKind: "work_specification", status: "unverified", sourceRef: "w1" },
    ]);
  });

  it("rejects non-array inventory", () => {
    expect(parseEvidenceInventory({})).toBeNull();
  });

  it("fails closed on unknown template id", () => {
    const result = runTradeCompletenessEvaluation("trade.unknown", []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TEMPLATE_NOT_FOUND");
  });

  it("ships migration for evaluation persistence", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261030220000_ais_rule_015_completeness_evaluations.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("construction_completeness_evaluations");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toContain("READY_FOR_HUMAN_REVIEW");
    expect(sql.toLowerCase()).not.toContain("workmanship pass");
  });
});
