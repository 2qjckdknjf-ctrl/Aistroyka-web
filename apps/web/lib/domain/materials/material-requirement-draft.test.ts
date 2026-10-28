import { describe, expect, it, vi } from "vitest";
import { materialRequirement } from "@/lib/domain/quantities/quantity-engine";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  addMaterialSupplierQuoteDraft,
  createMaterialRequirementDraft,
} from "./material-requirement-draft.service";

describe("AIS-MATERIAL-008 material requirement draft", () => {
  it("reuses pure materialRequirement for pack math", () => {
    expect(materialRequirement("8.820000", "1", "0.10", "1.44")).toMatchObject({
      material_need: "9.702000",
      pack_count: "7",
      purchase_quantity: "10.080000",
      issues: [],
    });
  });

  it("blocks lite clients from material draft routes", () => {
    expect(
      checkLiteAllowList(
        "/api/v1/projects/p1/quantities/acceptances/a1/material-requirement-draft",
        "POST",
        "ios_worker"
      )
    ).not.toBeNull();
    expect(
      checkLiteAllowList(
        "/api/v1/projects/p1/materials/requirement-drafts/d1/quotes",
        "POST",
        "android_lite"
      )
    ).not.toBeNull();
  });

  it("RLS migration is internal-writer only and draft-only", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261028200000_ais_material_008_requirement_drafts.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("material_requirement_drafts");
    expect(sql).toContain("material_supplier_quote_drafts");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/stock_status text not null default 'unknown'/);
    expect(sql).toMatch(/No order|not an order|comparison only/i);
    expect(sql).not.toMatch(/grant (select|all).*to anon/i);
  });

  it("createMaterialRequirementDraft fails closed when not accepted", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "acc-1", tenant_id: "t1", project_id: "p1", decision: "rejected" },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle })),
            })),
          })),
        })),
        insert: vi.fn(),
      })),
    };

    const result = await createMaterialRequirementDraft(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      workQuantity: "8.820000",
      consumption: "1",
      waste: "0.10",
      packCoverage: "1.44",
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_ACCEPTED" });
  });

  it("createMaterialRequirementDraft inserts computed need when accepted", async () => {
    const maybeSingleAcceptance = vi.fn().mockResolvedValue({
      data: { id: "acc-1", tenant_id: "t1", project_id: "p1", decision: "accepted" },
      error: null,
    });
    const maybeSingleInsert = vi.fn().mockResolvedValue({
      data: {
        id: "draft-1",
        acceptance_decision_id: "acc-1",
        work_quantity: "8.820000",
        material_need: "9.702000",
        pack_count: "7",
        purchase_quantity: "10.080000",
        issues: [],
      },
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "quantity_acceptance_decisions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle: maybeSingleAcceptance })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ maybeSingle: maybeSingleInsert })),
          })),
        };
      }),
    };

    const result = await createMaterialRequirementDraft(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      workQuantity: "8.820000",
      consumption: "1",
      waste: "0.10",
      packCoverage: "1.44",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.draft.material_need).toBe("9.702000");
    expect(result.draft.pack_count).toBe("7");
  });

  it("createMaterialRequirementDraft rejects fatal calculator issues before insert", async () => {
    const insert = vi.fn();
    const maybeSingleAcceptance = vi.fn().mockResolvedValue({
      data: { id: "acc-1", tenant_id: "t1", project_id: "p1", decision: "accepted" },
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "quantity_acceptance_decisions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle: maybeSingleAcceptance })),
                })),
              })),
            })),
          };
        }
        return { insert };
      }),
    };

    const invalid = await createMaterialRequirementDraft(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      workQuantity: "not-a-quantity",
      consumption: "1",
      waste: "0.10",
      packCoverage: "1.44",
    });
    expect(invalid).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(insert).not.toHaveBeenCalled();

    const precision = await createMaterialRequirementDraft(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      workQuantity: "1.000000001",
      consumption: "1",
      waste: "0",
      packCoverage: "1",
    });
    expect(precision).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("createMaterialRequirementDraft still inserts incomplete drafts with missing pack coverage", async () => {
    const maybeSingleAcceptance = vi.fn().mockResolvedValue({
      data: { id: "acc-1", tenant_id: "t1", project_id: "p1", decision: "accepted" },
      error: null,
    });
    const maybeSingleInsert = vi.fn().mockResolvedValue({
      data: {
        id: "draft-1",
        acceptance_decision_id: "acc-1",
        work_quantity: "8.820000",
        material_need: "9.702000",
        pack_count: null,
        purchase_quantity: null,
        issues: ["pack_coverage_missing"],
      },
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "quantity_acceptance_decisions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle: maybeSingleAcceptance })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ maybeSingle: maybeSingleInsert })),
          })),
        };
      }),
    };

    const result = await createMaterialRequirementDraft(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      workQuantity: "8.820000",
      consumption: "1",
      waste: "0.10",
      packCoverage: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.draft.issues).toContain("pack_coverage_missing");
  });

  it("addMaterialSupplierQuoteDraft defaults unknown stock and rejects bad price", async () => {
    const bad = await addMaterialSupplierQuoteDraft(
      {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "d1" }, error: null }),
                })),
              })),
            })),
          })),
          insert: vi.fn(),
        })),
      } as never,
      {
        tenantId: "t1",
        projectId: "p1",
        actorUserId: "u1",
        materialRequirementDraftId: "d1",
        supplierName: "Acme",
        sku: null,
        packageLabel: null,
        unitPriceMinor: "-1",
        coverageQuantity: null,
        region: null,
        shippingNote: null,
        stockStatus: "unknown",
        leadTimeDays: null,
        quoteDatedAt: "2026-10-28",
        quoteExpiresAt: null,
        provenanceNote: null,
      }
    );
    expect(bad).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });

  it("addMaterialSupplierQuoteDraft rejects negative or oversized lead time", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "d1" }, error: null }),
              })),
            })),
          })),
        })),
        insert: vi.fn(),
      })),
    };
    const base = {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      materialRequirementDraftId: "d1",
      supplierName: "Acme",
      sku: null,
      packageLabel: null,
      unitPriceMinor: "1999",
      coverageQuantity: null,
      region: null,
      shippingNote: null,
      stockStatus: "lead_time" as const,
      quoteDatedAt: "2026-10-28",
      quoteExpiresAt: null,
      provenanceNote: null,
    };

    const negative = await addMaterialSupplierQuoteDraft(supabase as never, {
      ...base,
      leadTimeDays: -1,
    });
    expect(negative).toMatchObject({ ok: false, code: "INVALID_INPUT" });

    const oversized = await addMaterialSupplierQuoteDraft(supabase as never, {
      ...base,
      leadTimeDays: 2147483648,
    });
    expect(oversized).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });
});
