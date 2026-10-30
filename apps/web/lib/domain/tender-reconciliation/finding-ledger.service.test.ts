import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertFindingDetailsSafe,
  createReconciliationFinding,
  parseReconciliationFindingKind,
} from "./finding-ledger.service";

describe("AIS-RECON-017 finding ledger", () => {
  it("rejects commercial keys in details", () => {
    expect(assertFindingDetailsSafe({ margin: 12 })).toMatch(/commercial field forbidden/);
    expect(assertFindingDetailsSafe({ note: "ok" })).toBeNull();
  });

  it("parses known kinds only", () => {
    expect(parseReconciliationFindingKind("quantity_mismatch")).toBe("quantity_mismatch");
    expect(parseReconciliationFindingKind("price_delta")).toBeNull();
  });

  it("requires quantities+unit for quantity_mismatch", async () => {
    const supabase = { from: vi.fn() };
    const result = await createReconciliationFinding(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      kind: "quantity_mismatch",
      title: "Area mismatch",
      summary: "Drawing 145 vs estimate 167",
      expectedQuantity: 167,
      observedQuantity: 145,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("inserts quantity_mismatch with unit and returns NEEDS_REVIEW", async () => {
    const row = {
      id: "f1",
      project_id: "p1",
      kind: "quantity_mismatch",
      status: "needs_review",
      title: "Area mismatch",
      summary: "145 vs 167",
      expected_quantity: 167,
      observed_quantity: 145,
      unit: "m2",
      source_document_ref: "drawing-1",
      source_revision: "r2",
      estimate_ref: "est-1",
      measurement_method: "pdf_takeoff",
      uncertainty: "medium",
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: "2026-10-30T00:00:00.000Z",
    };
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
          })),
        })),
      })),
    };
    const result = await createReconciliationFinding(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      kind: "quantity_mismatch",
      title: "Area mismatch",
      summary: "145 vs 167",
      expectedQuantity: 167,
      observedQuantity: 145,
      unit: "m2",
      sourceDocumentRef: "drawing-1",
      sourceRevision: "r2",
      estimateRef: "est-1",
      measurementMethod: "pdf_takeoff",
      uncertainty: "medium",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.finding.status).toBe("needs_review");
    expect(result.finding.observed_quantity).toBe(145);
    expect(JSON.stringify(result.finding)).not.toMatch(/margin|unit_price/i);
  });

  it("ships Finding Ledger migration without estimate mutation helpers", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261030240000_ais_recon_017_finding_ledger.sql"),
      "utf8"
    );
    expect(sql).toContain("tender_reconciliation_findings");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql.toLowerCase()).not.toContain("update public.estimates");
  });
});
