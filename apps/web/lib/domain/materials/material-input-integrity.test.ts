import { describe, expect, it, vi } from "vitest";
import { createMaterialSupplyDraftComparison } from "./draft-comparison.service";
import { addMaterialSupplierQuoteDraft, createMaterialRequirementDraft } from "./material-requirement-draft.service";

type Row = Record<string, unknown>;

/** Query fixture applies real tenant/project/draft filters and records persisted rows. */
function database(tables: Record<string, Row[]>) {
  const writes: Array<{ table: string; row: Row }> = [];
  const from = vi.fn((table: string) => {
    let rows = [...(tables[table] ?? [])];
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { rows = rows.filter(row => row[key] === value); return query; },
      in: (key: string, values: unknown[]) => { rows = rows.filter(row => values.some(value => typeof value === "string" && typeof row[key] === "string" ? value.toLowerCase() === (row[key] as string).toLowerCase() : value === row[key])); return query; },
      insert: (row: Row) => {
        writes.push({ table, row });
        rows = [{ id: "created", ...row }];
        return query;
      },
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    return query;
  });
  return { client: { from } as never, writes };
}

const scope = { tenantId: "tenant", projectId: "project", actorUserId: "manager" };
const requirementInput = { ...scope, acceptanceDecisionId: "accepted", workQuantity: "8.820000", consumption: "1", waste: "0.10", packCoverage: "1.44" };
const acceptance = { id: "accepted", tenant_id: "tenant", project_id: "project", decision: "accepted", calculation_revision_id: "calculation" };
const acceptedCalculation = { id: "calculation", tenant_id: "tenant", project_id: "project", quantity: "8.820000" };

describe("material requirement input integrity", () => {
  it.each([
    { consumption: 0.5 },
    { waste: [] },
    { packCoverage: {} },
  ])("does not silently erase an invalid supplied decimal: %j", async (invalid) => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [acceptedCalculation] });
    const result = await createMaterialRequirementDraft(db.client, { ...requirementInput, ...invalid } as never);
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(db.writes).toEqual([]);
  });
  it("does not let a valid different quantity occupy the accepted calculation's immutable draft", async () => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [acceptedCalculation] });
    const result = await createMaterialRequirementDraft(db.client, { ...requirementInput, workQuantity: "999" });
    expect(result).toMatchObject({ ok: false, code: "QUANTITY_MISMATCH" });
    expect(db.writes).toEqual([]);
  });
  it("accepts an equivalent decimal representation of the actual accepted quantity", async () => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [acceptedCalculation] });
    expect((await createMaterialRequirementDraft(db.client, { ...requirementInput, workQuantity: "8.82" })).ok).toBe(true);
    expect(db.writes[0].row.work_quantity).toBe("8.820000");
  });
  it("does not trust a calculation revision from another project", async () => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [{ ...acceptedCalculation, project_id: "other" }] });
    expect((await createMaterialRequirementDraft(db.client, requirementInput)).ok).toBe(false);
    expect(db.writes).toEqual([]);
  });
  it.each([
    { workQuantity: "invalid" },
    { workQuantity: "1.000000001" },
    { workQuantity: "100000000000000000000000000000000", consumption: "100000000000000000000000000000000" },
    { packCoverage: "0" },
    { workQuantity: "0.000000001" },
  ])("rejects a fatal calculation before occupying the unique acceptance slot: %j", async (invalid) => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [acceptedCalculation] });
    const result = await createMaterialRequirementDraft(db.client, { ...requirementInput, ...invalid });
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(db.writes).toEqual([]);
    const retry = await createMaterialRequirementDraft(db.client, requirementInput);
    expect(retry.ok).toBe(true);
    expect(db.writes).toHaveLength(1);
  });

  it("keeps an explicitly incomplete draft when optional material parameters are absent", async () => {
    const db = database({ quantity_acceptance_decisions: [acceptance], quantity_calculation_revisions: [acceptedCalculation] });
    const result = await createMaterialRequirementDraft(db.client, { ...requirementInput, consumption: null });
    expect(result).toMatchObject({ ok: true, draft: { issues: ["material_parameters_missing"] } });
    expect(db.writes).toHaveLength(1);
  });
});

const quoteInput = {
  ...scope, materialRequirementDraftId: "draft", supplierName: "Fixture supplier", sku: null,
  packageLabel: null, unitPriceMinor: "1000", coverageQuantity: null, region: null, shippingNote: null,
  stockStatus: "unknown" as const, leadTimeDays: null as number | null, quoteDatedAt: "2026-11-27",
  quoteExpiresAt: null, provenanceNote: null,
};
const requirement = { id: "draft", tenant_id: "tenant", project_id: "project", work_quantity: "8.820000", purchase_quantity: "10.080000", pack_coverage: "1.44" };

describe("supplier quote lead time", () => {
  it.each([-1, 0.5, 2147483648, NaN, Infinity])("rejects invalid lead time %s before database insertion", async (leadTimeDays) => {
    const db = database({ material_requirement_drafts: [requirement] });
    expect(await addMaterialSupplierQuoteDraft(db.client, { ...quoteInput, leadTimeDays }))
      .toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(db.writes).toEqual([]);
  });
  it.each([null, 0, 14, 2147483647])("persists valid nullable integer lead time %s", async (leadTimeDays) => {
    const db = database({ material_requirement_drafts: [requirement] });
    expect((await addMaterialSupplierQuoteDraft(db.client, { ...quoteInput, leadTimeDays })).ok).toBe(true);
    expect(db.writes[0].row.lead_time_days).toBe(leadTimeDays);
  });
});

const quotes = ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "cccccccc-cccc-4ccc-8ccc-cccccccccccc"].map(id => ({
  id, tenant_id: "tenant", project_id: "project", material_requirement_draft_id: "draft",
  supplier_name: id, unit_price_minor: "1000", coverage_quantity: "1.44", stock_status: "unknown",
  quote_dated_at: "2026-11-27", quote_expires_at: null, provenance_note: "synthetic test",
}));

describe("immutable comparison selection", () => {
  it.each([
    ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "99999999-9999-4999-8999-999999999999"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "dddddddd-dddd-4ddd-8ddd-dddddddddddd"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "ffffffff-ffff-4fff-8fff-ffffffffffff"],
    [], [""], ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", 123],
  ])("rejects an incomplete or invalid requested set: %j", async (...offerIds) => {
    const db = database({
      material_requirement_drafts: [requirement],
      material_supplier_quote_drafts: [...quotes,
        { ...quotes[0], id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", project_id: "different" },
        { ...quotes[0], id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", material_requirement_draft_id: "different" },
        { ...quotes[0], id: "ffffffff-ffff-4fff-8fff-ffffffffffff", tenant_id: "different" },
      ],
    });
    const result = await createMaterialSupplyDraftComparison(db.client, {
      ...scope, materialRequirementDraftId: "draft", offerIds: offerIds as string[],
    });
    expect(result).toMatchObject({ ok: false });
    expect(db.writes).toEqual([]);
  });

  it("persists exactly the explicit set and never includes an unselected quote", async () => {
    const db = database({ material_requirement_drafts: [requirement], material_supplier_quote_drafts: quotes });
    const result = await createMaterialSupplyDraftComparison(db.client, {
      ...scope, materialRequirementDraftId: "draft", offerIds: ["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"], asOfDate: "2026-11-27",
    });
    expect(result.ok).toBe(true);
    expect(db.writes[0].row.offer_ids).toEqual(expect.arrayContaining(["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]));
    expect(db.writes[0].row.offer_ids).toHaveLength(2);
  });
  it("canonicalizes PostgreSQL UUID case before matching and deduplicating a selection", async () => {
    const db = database({ material_requirement_drafts: [requirement], material_supplier_quote_drafts: quotes });
    const result = await createMaterialSupplyDraftComparison(db.client, {
      ...scope, materialRequirementDraftId: "draft",
      offerIds: [quotes[0].id.toUpperCase(), quotes[1].id.toUpperCase(), quotes[0].id], asOfDate: "2026-11-27",
    });
    expect(result.ok).toBe(true);
    expect(db.writes[0].row.offer_ids).toEqual([quotes[0].id, quotes[1].id]);
  });
});
