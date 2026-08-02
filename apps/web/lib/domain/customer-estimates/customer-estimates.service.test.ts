import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCustomerEstimate, sendCustomerEstimate, patchCustomerEstimate, respondToCustomerEstimate } from "./customer-estimates.service";
import * as tenantPolicy from "@/lib/tenant/tenant.policy";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
import { getAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canManageProjects: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn().mockResolvedValue(true),
  canRespondToClientRequests: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  createClientRequest: vi.fn(),
  respondToClientRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

function chain(result: unknown) {
  return {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }),
    single: vi.fn().mockResolvedValue({ data: result, error: null }),
  };
}

const ctx = { tenantId: "t1", userId: "u1", role: "owner" as const };

describe("customer-estimates.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenantPolicy.canManageProjects).mockReturnValue(true);
    vi.mocked(getAdminClient).mockReturnValue(null);
  });

  it("creates a customer estimate without internal cost fields", async () => {
    const row = {
      id: "e1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Proposal",
      description: null,
      status: "draft",
      total_amount: 1000,
      currency: "RUB",
      valid_until: null,
      created_by: "u1",
      sent_to_customer_at: null,
      approved_by_customer_at: null,
      rejected_by_customer_at: null,
      customer_note: null,
      linked_document_id: null,
      linked_decision_request_id: null,
      created_at: "now",
      updated_at: "now",
    };
    const builder = chain(row);
    const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;

    const res = await createCustomerEstimate(supabase, ctx, "p1", {
      title: "Proposal",
      total_amount: 1000,
    });

    expect(res.error).toBe("");
    expect(JSON.stringify(res.data)).not.toContain("actual_amount");
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ total_amount: 1000 }));
  });

  it("send creates linked estimate_approval decision request", async () => {
    const row = {
      id: "e1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Proposal",
      description: "Customer proposal",
      status: "draft",
      total_amount: 1000,
      currency: "RUB",
      valid_until: null,
      created_by: "u1",
      sent_to_customer_at: null,
      approved_by_customer_at: null,
      rejected_by_customer_at: null,
      customer_note: null,
      linked_document_id: null,
      linked_decision_request_id: null,
      created_at: "now",
      updated_at: "now",
    };
    const builder = chain({ ...row, status: "sent", linked_decision_request_id: "d1" });
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;
    vi.mocked(clientRequests.createClientRequest).mockResolvedValue({
      data: { id: "d1", title: "Proposal" } as never,
      error: "",
    });

    const res = await sendCustomerEstimate(supabase, ctx, "p1", "e1");

    expect(res.error).toBe("");
    expect(clientRequests.createClientRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "p1",
      expect.objectContaining({
        decision_type: "estimate_approval",
        customer_visible_amount: 1000,
      })
    );
  });

  it("patchCustomerEstimate allows editing draft only", async () => {
    const row = {
      id: "e1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Proposal",
      description: null,
      status: "sent",
      total_amount: 1000,
      currency: "RUB",
      valid_until: null,
      created_by: "u1",
      sent_to_customer_at: "now",
      approved_by_customer_at: null,
      rejected_by_customer_at: null,
      customer_note: null,
      linked_document_id: null,
      linked_decision_request_id: "d1",
      created_at: "now",
      updated_at: "now",
    };
    const builder = chain(row);
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;

    const res = await patchCustomerEstimate(supabase, ctx, "p1", "e1", { title: "Nope" });

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/draft/i);
  });

  it("respondToCustomerEstimate fails when linked decision respond fails", async () => {
    const row = {
      id: "e1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Proposal",
      description: null,
      status: "sent",
      total_amount: 1000,
      currency: "RUB",
      valid_until: null,
      created_by: "u1",
      sent_to_customer_at: "now",
      approved_by_customer_at: null,
      rejected_by_customer_at: null,
      customer_note: null,
      linked_document_id: null,
      linked_decision_request_id: "d1",
      created_at: "now",
      updated_at: "now",
    };
    const builder = chain(row);
    builder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({ data: null, error: "Not open" });

    const res = await respondToCustomerEstimate(supabase, ctx, "p1", "e1", "approve", null);

    expect(res.data).toBeNull();
    expect(res.error).toBeTruthy();
  });

  it("respondToCustomerEstimate writes estimate and commercial item via service-role client", async () => {
    const row = {
      id: "e1",
      tenant_id: "t1",
      project_id: "p1",
      title: "Proposal",
      description: null,
      status: "sent",
      total_amount: 1000,
      currency: "RUB",
      valid_until: null,
      created_by: "u1",
      sent_to_customer_at: "now",
      approved_by_customer_at: null,
      rejected_by_customer_at: null,
      customer_note: null,
      linked_document_id: null,
      linked_decision_request_id: "d1",
      created_at: "now",
      updated_at: "now",
    };
    const approved = {
      ...row,
      status: "approved",
      approved_by_customer_at: "now",
    };
    const userBuilder = chain(row);
    userBuilder.maybeSingle.mockResolvedValue({ data: row, error: null });
    const supabase = { from: vi.fn(() => userBuilder) } as unknown as SupabaseClient;

    const adminBuilder = chain(approved);
    const adminInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    adminBuilder.insert = adminInsert;
    const admin = { from: vi.fn((table: string) => (table === "project_commercial_items" ? { insert: adminInsert } : adminBuilder)) } as unknown as SupabaseClient;
    vi.mocked(getAdminClient).mockReturnValue(admin as never);
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { id: "d1", title: "Proposal" } as never,
      error: "",
    });

    const res = await respondToCustomerEstimate(supabase, ctx, "p1", "e1", "approve", null);

    expect(res.error).toBe("");
    expect(res.data?.status).toBe("approved");
    expect(admin.from).toHaveBeenCalledWith("customer_estimates");
    expect(admin.from).toHaveBeenCalledWith("project_commercial_items");
    expect(adminInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "expected_revenue",
        amount: 1000,
        title: "Proposal",
      })
    );
    // User-scoped client is only used for the initial read (and linked decision path).
    expect(supabase.from).toHaveBeenCalledWith("customer_estimates");
  });
});
