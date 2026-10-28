import { describe, expect, it, vi } from "vitest";
import { createMaterialSupplyDraftComparison } from "./draft-comparison.service";

function quoteRow(id: string) {
  return {
    id,
    supplier_name: `Supplier ${id}`,
    unit_price_minor: "100",
    coverage_quantity: "1.000000",
    stock_status: "in_stock",
    quote_dated_at: "2026-10-01",
    quote_expires_at: null,
    provenance_note: "manual",
  };
}

function makeSupabase(quotes: Record<string, unknown>[]) {
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "cmp-1",
          material_requirement_draft_id: "d1",
          policy_version: "material_supply.draft_compare.v1",
          result_payload: {},
          issues: [],
        },
        error: null,
      }),
    })),
  }));
  const quoteQuery: Record<string, unknown> = {
    select: () => quoteQuery,
    eq: () => quoteQuery,
    in: () => quoteQuery,
    then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: quotes, error: null }).then(resolve),
  };
  return {
    insert,
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "material_requirement_drafts") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "d1",
                        purchase_quantity: "10.080000",
                        material_need: "9.702000",
                        pack_coverage: "1.440000",
                        work_quantity: "8.820000",
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          };
        }
        if (table === "material_supplier_quote_drafts") {
          return quoteQuery;
        }
        return { insert };
      }),
    },
  };
}

const baseInput = {
  tenantId: "t1",
  projectId: "p1",
  actorUserId: "u1",
  materialRequirementDraftId: "d1",
};

describe("AIS-MATERIAL-008 draft comparison service offer ids", () => {
  it("rejects an empty requested offer id list instead of comparing every quote", async () => {
    const { supabase, insert } = makeSupabase([quoteRow("a"), quoteRow("b")]);
    const result = await createMaterialSupplyDraftComparison(supabase as never, {
      ...baseInput,
      offerIds: [],
    });
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects requested offer ids that are missing or out of scope", async () => {
    const { supabase, insert } = makeSupabase([quoteRow("a"), quoteRow("b")]);
    const result = await createMaterialSupplyDraftComparison(supabase as never, {
      ...baseInput,
      offerIds: ["a", "missing"],
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(insert).not.toHaveBeenCalled();
  });
});
