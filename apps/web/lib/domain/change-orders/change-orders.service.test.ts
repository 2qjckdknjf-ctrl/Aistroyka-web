import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getChangeOrderDetail,
  listChangeOrders,
  respondToChangeOrderByCustomer,
  transitionChangeOrder,
  updateChangeOrderContent,
} from "./change-orders.service";
import * as repo from "./change-orders.repository";
import * as policy from "./change-orders.policy";

vi.mock("./change-orders.repository", () => ({
  insertChangeOrder: vi.fn(),
  listByProject: vi.fn(),
  getById: vi.fn(),
  updateChangeOrder: vi.fn(),
  listEvents: vi.fn(),
  insertEvent: vi.fn(),
  listForTimeline: vi.fn(),
}));

vi.mock("./change-orders.policy", () => ({
  canManageChangeOrders: vi.fn(),
  canReadChangeOrders: vi.fn(),
}));

describe("change-orders.service", () => {
  const ctx = { tenantId: "t1", userId: "u1", role: "owner" } as never;
  const supabase = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listChangeOrders excludes draft for non-manager", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(repo.listByProject).mockResolvedValue([
      {
        id: "c1",
        kind: "manager_proposed",
        status: "proposed",
        title: "Customer-visible change",
        schedule_impact_level: "none",
        budget_impact_level: "major_increase",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ] as never);
    const r = await listChangeOrders(supabase, ctx, "p1");
    expect(repo.listByProject).toHaveBeenCalledWith(supabase, "p1", "t1", { excludeDraft: true });
    expect(JSON.stringify(r.data)).not.toContain("budget_impact_level");
  });

  it("getChangeOrderDetail hides draft from stakeholder", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "draft",
      title: "X",
      kind: "other",
      description: null,
      schedule_impact_level: "none",
      budget_impact_level: "none",
      schedule_impact_summary: null,
      budget_impact_summary: null,
      schedule_delta_days: null,
      budget_delta_amount: null,
      linked_discussion_id: null,
      linked_document_id: null,
      linked_request_id: null,
      linked_milestone_id: null,
      created_by: "u2",
      implemented_at: null,
      implemented_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    } as never);
    const r = await getChangeOrderDetail(supabase, ctx, "p1", "c1");
    expect(r.data).toBeNull();
    expect(r.error).toBe("Not found");
  });

  it("getChangeOrderDetail strips budget fields for stakeholder detail", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "proposed",
      title: "X",
      kind: "other",
      description: null,
      schedule_impact_level: "minor_shift",
      budget_impact_level: "major_increase",
      schedule_impact_summary: "Customer-safe schedule note",
      budget_impact_summary: "Internal budget note",
      schedule_delta_days: 2,
      budget_delta_amount: 1000,
      linked_discussion_id: null,
      linked_document_id: null,
      linked_request_id: null,
      linked_milestone_id: null,
      created_by: "u2",
      implemented_at: null,
      implemented_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    } as never);
    vi.mocked(repo.listEvents).mockResolvedValue([]);

    const r = await getChangeOrderDetail(supabase, ctx, "p1", "c1");
    const json = JSON.stringify(r.data);
    expect(r.error).toBe("");
    expect(json).not.toContain("budget_impact_level");
    expect(json).not.toContain("budget_impact_summary");
    expect(json).not.toContain("budget_delta_amount");
    expect(json).not.toContain("Internal budget note");
  });

  it("transitionChangeOrder rejects invalid transition", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "draft",
    } as never);
    const r = await transitionChangeOrder(supabase, ctx, "p1", "c1", "implemented");
    expect(r.ok).toBe(false);
    expect(repo.updateChangeOrder).not.toHaveBeenCalled();
  });

  it("respondToChangeOrderByCustomer rejects managers", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    const r = await respondToChangeOrderByCustomer(supabase, ctx, "p1", "c1", "approve");
    expect(r.data).toBeNull();
    expect(r.error).toBe("Insufficient rights");
    expect(repo.getById).not.toHaveBeenCalled();
  });

  it("respondToChangeOrderByCustomer approves from proposed for stakeholder", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(false);
    const baseRow = {
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "proposed" as const,
      title: "Extra work",
      kind: "manager_proposed" as const,
      description: null,
      schedule_impact_level: "none" as const,
      budget_impact_level: "none" as const,
      schedule_impact_summary: null,
      budget_impact_summary: null,
      schedule_delta_days: null,
      budget_delta_amount: null,
      linked_discussion_id: null,
      linked_document_id: null,
      linked_request_id: null,
      linked_milestone_id: null,
      created_by: "u2",
      implemented_at: null,
      implemented_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(repo.getById)
      .mockResolvedValueOnce(baseRow as never)
      .mockResolvedValueOnce({ ...baseRow, status: "approved", updated_at: "2026-01-02T00:00:00.000Z" } as never);
    vi.mocked(repo.updateChangeOrder).mockResolvedValue(true);
    vi.mocked(repo.listEvents).mockResolvedValue([]);

    const r = await respondToChangeOrderByCustomer(supabase, ctx, "p1", "c1", "approve");
    expect(r.error).toBe("");
    expect(r.data?.status).toBe("approved");
    expect(repo.updateChangeOrder).toHaveBeenCalledWith(
      supabase,
      "c1",
      "t1",
      expect.objectContaining({ status: "approved", approved_by_customer: "u1" })
    );
    expect(repo.insertEvent).toHaveBeenCalled();
  });

  it("updateChangeOrderContent rejects when locked", async () => {
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "approved",
    } as never);
    const r = await updateChangeOrderContent(supabase, ctx, "p1", "c1", { title: "x" });
    expect(r.ok).toBe(false);
    expect(r.error).toContain("locked");
  });
  it("getChangeOrderDetail forcePublic strips manager budget fields", async () => {
    vi.mocked(policy.canReadChangeOrders).mockResolvedValue(true);
    vi.mocked(policy.canManageChangeOrders).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "c1",
      project_id: "p1",
      tenant_id: "t1",
      status: "proposed",
      title: "X",
      kind: "other",
      description: null,
      schedule_impact_level: "minor_shift",
      budget_impact_level: "major_increase",
      schedule_impact_summary: "ok",
      budget_impact_summary: "secret",
      schedule_delta_days: 1,
      budget_delta_amount: 1000,
      customer_amount_delta: 200,
      currency: "EUR",
      linked_discussion_id: null,
      linked_document_id: null,
      linked_request_id: null,
      linked_milestone_id: null,
      created_by: "u2",
      implemented_at: null,
      implemented_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    } as never);
    vi.mocked(repo.listEvents).mockResolvedValue([]);

    const r = await getChangeOrderDetail(supabase, ctx, "p1", "c1", { forcePublic: true });
    const json = JSON.stringify(r.data);
    expect(r.error).toBe("");
    expect(json).not.toContain("budget_delta_amount");
    expect(json).not.toContain("budget_impact_level");
    expect(json).toContain("customer_amount_delta");
  });

});
