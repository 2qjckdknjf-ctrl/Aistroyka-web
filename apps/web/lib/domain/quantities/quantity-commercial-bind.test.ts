import { describe, expect, it, vi } from "vitest";
import { calculateCommercialLine, type CommercialInput } from "./commercial";
import { isQuantityCommerciallyBindable } from "./quantity-acceptance";
import { bindAcceptedQuantityCommercial } from "./quantity-commercial-bind.service";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function exampleCommercial(): CommercialInput {
  const context = {
    work_spec_hash: "a".repeat(64),
    unit: "m2" as const,
    purpose: "work" as const,
    quantity_basis: "physical_net" as const,
    component_id: null,
  };
  return {
    currency: "EUR",
    quantity: { value: "10.000000", context },
    price: {
      price_use: "cost_input",
      context,
      rate: {
        numerator_minor: "1999",
        denominator_quantity: "7.200000",
        unit: "m2",
        currency: "EUR",
        tax_treatment: "excluded",
      },
    },
    minimum_billable_quantity: null,
    fixed_charges: [],
    markup_bps: "0",
    discount: { kind: "none" },
    tax_bps: "0",
  };
}

describe("Stage2a A05 commercial bind gate", () => {
  it("only accepted decisions are commercially bindable", () => {
    expect(isQuantityCommerciallyBindable("accepted")).toBe(true);
    expect(isQuantityCommerciallyBindable("rejected")).toBe(false);
    expect(isQuantityCommerciallyBindable("insufficient_basis")).toBe(false);
    expect(isQuantityCommerciallyBindable(null)).toBe(false);
  });

  it("commercial engine still rejects malformed cost-input payloads", () => {
    const bad = calculateCommercialLine({ quantity: { value: "1.000000" } });
    expect(bad.ok).toBe(false);
  });

  it("blocks lite/worker clients from commercial-bind path", () => {
    const path =
      "/api/v1/projects/p1/quantities/acceptances/a1/commercial-bind";
    expect(checkLiteAllowList(path, "POST", "ios_worker")).not.toBeNull();
    expect(checkLiteAllowList(path, "POST", "android_lite")).not.toBeNull();
    expect(checkLiteAllowList(path, "POST", null)).toBeNull();
  });

  it("RLS migration is internal-writer only", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261028190000_stage2a_a05_commercial_quantity_bindings.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("quantity_commercial_bindings");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toContain("enable row level security");
    expect(sql).toMatch(/never (exposed on portal|portal-facing)/i);
    expect(sql).not.toMatch(/create policy[\s\S]*stakeholder/i);
    expect(sql).not.toMatch(/grant (select|all).*to anon/i);
  });

  it("bindAcceptedQuantityCommercial fails closed when decision is not accepted", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "acc-1",
        tenant_id: "t1",
        project_id: "p1",
        decision: "rejected",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle,
              })),
            })),
          })),
        })),
        insert: vi.fn(),
      })),
    };

    const result = await bindAcceptedQuantityCommercial(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      commercialInput: exampleCommercial(),
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_ACCEPTED" });
  });

  it("bindAcceptedQuantityCommercial inserts when accepted and commercial ok", async () => {
    const commercial = exampleCommercial();
    const maybeSingleAcceptance = vi.fn().mockResolvedValue({
      data: {
        id: "acc-1",
        tenant_id: "t1",
        project_id: "p1",
        decision: "accepted",
      },
      error: null,
    });
    const maybeSingleInsert = vi.fn().mockResolvedValue({
      data: {
        id: "bind-1",
        acceptance_decision_id: "acc-1",
        work_spec_hash: "a".repeat(64),
        issues: [],
        result_payload: { ok: true },
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
                  eq: vi.fn(() => ({
                    maybeSingle: maybeSingleAcceptance,
                  })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: maybeSingleInsert,
            })),
          })),
        };
      }),
    };

    const result = await bindAcceptedQuantityCommercial(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      commercialInput: commercial,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.binding.id).toBe("bind-1");
    expect(result.binding.work_spec_hash).toBe("a".repeat(64));
  });

  it("bindAcceptedQuantityCommercial rejects invalid commercial input", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "acc-1",
        tenant_id: "t1",
        project_id: "p1",
        decision: "accepted",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle,
              })),
            })),
          })),
        })),
        insert: vi.fn(),
      })),
    };

    const result = await bindAcceptedQuantityCommercial(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      actorUserId: "u1",
      acceptanceDecisionId: "acc-1",
      commercialInput: { currency: "EUR" },
    });
    expect(result).toMatchObject({ ok: false, code: "COMMERCIAL_INVALID" });
  });
});
