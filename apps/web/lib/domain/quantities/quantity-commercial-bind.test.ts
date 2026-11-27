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

function acceptedQuantityFixture() {
  const writes: unknown[] = [];
  const rows: Record<string, Record<string, unknown>> = {
    quantity_acceptance_decisions: { id: "acc-1", tenant_id: "t1", project_id: "p1", decision: "accepted", calculation_revision_id: "calc-1" },
    quantity_calculation_revisions: { id: "calc-1", tenant_id: "t1", project_id: "p1", input_snapshot_id: "snap-1", quantity: "10.000000", unit: "m2", quantity_basis: "physical_net" },
    quantity_input_snapshots: { id: "snap-1", tenant_id: "t1", project_id: "p1", request_hash: "a".repeat(64) },
  };
  const from = vi.fn((table: string) => {
    let row: Record<string, unknown> | null = rows[table] ?? null;
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { if (row && row[key] !== value) row = null; return query; },
      insert: (value: Record<string, unknown>) => { writes.push(value); row = { id: "bind-1", ...value }; return query; },
      maybeSingle: async () => ({ data: row, error: null }),
    };
    return query;
  });
  return { client: { from } as never, rows, writes };
}

describe("commercial binding matches the accepted calculation identity", () => {
  it.each(["quantity", "unit", "basis", "hash"])("rejects a different %s before locking the immutable binding", async (field) => {
    const db = acceptedQuantityFixture();
    const commercial = exampleCommercial();
    if (field === "quantity") commercial.quantity.value = "11.000000";
    if (field === "unit") { commercial.quantity.context.unit = "m"; commercial.price.rate.unit = "m"; commercial.quantity.context.quantity_basis = "joint_length"; }
    if (field === "basis") commercial.quantity.context.quantity_basis = "system_area";
    if (field === "hash") commercial.quantity.context.work_spec_hash = "b".repeat(64);
    expect(calculateCommercialLine(commercial).ok).toBe(true);
    const result = await bindAcceptedQuantityCommercial(db.client, {
      tenantId: "t1", projectId: "p1", actorUserId: "u1", acceptanceDecisionId: "acc-1", commercialInput: commercial,
    });
    expect(result).toMatchObject({ ok: false, code: "QUANTITY_MISMATCH" });
    expect(db.writes).toEqual([]);
  });

  it.each(["quantity_calculation_revisions", "quantity_input_snapshots"])("fails closed when linked %s belongs to another project", async (table) => {
    const db = acceptedQuantityFixture(); db.rows[table].project_id = "other-project";
    expect((await bindAcceptedQuantityCommercial(db.client, {
      tenantId: "t1", projectId: "p1", actorUserId: "u1", acceptanceDecisionId: "acc-1", commercialInput: exampleCommercial(),
    })).ok).toBe(false);
    expect(db.writes).toEqual([]);
  });

  it("binds a valid cost calculation to exactly the accepted revision", async () => {
    const db = acceptedQuantityFixture();
    const result = await bindAcceptedQuantityCommercial(db.client, {
      tenantId: "t1", projectId: "p1", actorUserId: "u1", acceptanceDecisionId: "acc-1", commercialInput: exampleCommercial(),
    });
    expect(result.ok).toBe(true); expect(db.writes).toHaveLength(1);
  });
});

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
    const db = acceptedQuantityFixture();
    const result = await bindAcceptedQuantityCommercial(db.client, {
      tenantId: "t1", projectId: "p1", actorUserId: "u1", acceptanceDecisionId: "acc-1",
      commercialInput: exampleCommercial(),
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
