import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createQuote } from "@/app/api/v1/projects/[id]/materials/requirement-drafts/[draftId]/quotes/route";
import { POST as createComparison } from "@/app/api/v1/projects/[id]/materials/requirement-drafts/[draftId]/comparisons/route";
import { POST as createRequirement } from "@/app/api/v1/projects/[id]/quantities/acceptances/[acceptanceId]/material-requirement-draft/route";

const services = vi.hoisted(() => ({ quote: vi.fn(), comparison: vi.fn(), requirement: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: async () => ({ rpc: async () => ({ data: true, error: null }) }) }));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: async () => ({ tenantId: "tenant", userId: "manager", role: "owner" }),
  requireTenant: () => {}, TenantRequiredError: class extends Error {},
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({ getById: async () => ({ id: "project" }) }));
vi.mock("@/lib/domain/materials/material-requirement-draft.service", () => ({ addMaterialSupplierQuoteDraft: services.quote, createMaterialRequirementDraft: services.requirement }));
vi.mock("@/lib/domain/materials/draft-comparison.service", () => ({ createMaterialSupplyDraftComparison: services.comparison }));
vi.mock("@/lib/observability/audit.service", () => ({ emitAudit: async () => {} }));
beforeEach(() => {
  services.quote.mockReset().mockResolvedValue({ ok: true, quote: { id: "quote", stock_status: "unknown" } });
  services.comparison.mockReset().mockResolvedValue({ ok: true, comparison: { id: "comparison", policy_version: "fixture" } });
  services.requirement.mockReset().mockResolvedValue({ ok: true, draft: { id: "draft", issues: [] } });
});
const context = { params: Promise.resolve({ id: "project", draftId: "draft" }) };
const request = (body: unknown) => new Request("https://fixture.invalid/materials", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
it.each([null, [], 42])("rejects a non-object material requirement body %j", async (body) => {
  expect((await createRequirement(request(body), { params: Promise.resolve({ id: "project", acceptanceId: "acceptance" }) })).status).toBe(400);
  expect(services.requirement).not.toHaveBeenCalled();
});
describe("material requirement HTTP decimals", () => {
  it.each([
    { consumption: 0.5 },
    { waste: [] },
    { pack_coverage: {} },
    { packCoverage: 1.44 },
  ])("rejects supplied invalid optional decimals %j before mutation", async (invalid) => {
    expect((await createRequirement(request({ work_quantity: "8.82", ...invalid }), {
      params: Promise.resolve({ id: "project", acceptanceId: "acceptance" }),
    })).status).toBe(400);
    expect(services.requirement).not.toHaveBeenCalled();
  });
  it.each([{}, { consumption: null, waste: null, pack_coverage: null }])("preserves missing optional parameters %j", async (optional) => {
    expect((await createRequirement(request({ work_quantity: "8.82", ...optional }), {
      params: Promise.resolve({ id: "project", acceptanceId: "acceptance" }),
    })).status).toBe(201);
    expect(services.requirement.mock.calls[0][1]).toMatchObject({ consumption: null, waste: null, packCoverage: null });
  });
  it("returns a client error when a submitted quantity differs from the accepted calculation", async () => {
    services.requirement.mockResolvedValue({ ok: false, code: "QUANTITY_MISMATCH", error: "quantity mismatch" });
    expect((await createRequirement(request({ work_quantity: "999" }), {
      params: Promise.resolve({ id: "project", acceptanceId: "acceptance" }),
    })).status).toBe(400);
  });
});
describe("quote HTTP validation", () => {
  it.each([-1, 1.5, 2147483648, "7", [], {}])("does not truncate or erase invalid lead time %j", async (lead_time_days) => {
    expect((await createQuote(request({ lead_time_days }), context)).status).toBe(400);
    expect(services.quote).not.toHaveBeenCalled();
  });
  it.each([null, 0, 14, 2147483647])("forwards valid lead time %j unchanged", async (lead_time_days) => {
    expect((await createQuote(request({ lead_time_days }), context)).status).toBe(201);
    expect(services.quote.mock.calls[0][1].leadTimeDays).toBe(lead_time_days);
  });
});
describe("comparison HTTP selection", () => {
  it.each([[], [""], ["quote-a", 12], "quote-a", {}])("never filters %j into a different selection", async (offer_ids) => {
    expect((await createComparison(request({ offer_ids }), context)).status).toBe(400);
    expect(services.comparison).not.toHaveBeenCalled();
  });
  it("preserves the complete valid selection for the domain service", async () => {
    expect((await createComparison(request({ offer_ids: ["quote-a", "quote-b"] }), context)).status).toBe(201);
    expect(services.comparison.mock.calls[0][1].offerIds).toEqual(["quote-a", "quote-b"]);
  });
  it.each([null, []])("rejects a non-object JSON body %j", async (body) => {
    expect((await createComparison(request(body), context)).status).toBe(400);
    expect((await createQuote(request(body), context)).status).toBe(400);
    expect(services.comparison).not.toHaveBeenCalled(); expect(services.quote).not.toHaveBeenCalled();
  });
});
