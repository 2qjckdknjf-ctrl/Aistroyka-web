/**
 * Legacy Stripe webhook: apply before mark-processed so failed applies can retry.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminClient = vi.fn();
const isWebhookConfigured = vi.fn();
const verifyWebhookEvent = vi.fn();
const handleCheckoutCompleted = vi.fn();
const handleSubscriptionUpdated = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/platform/billing/webhooks.handler", () => ({
  isWebhookConfigured: (...args: unknown[]) => isWebhookConfigured(...args),
  verifyWebhookEvent: (...args: unknown[]) => verifyWebhookEvent(...args),
  handleCheckoutCompleted: (...args: unknown[]) => handleCheckoutCompleted(...args),
  handleSubscriptionUpdated: (...args: unknown[]) => handleSubscriptionUpdated(...args),
}));

type ProcessedTable = {
  selectCalls: number;
  insertCalls: Array<Record<string, unknown>>;
  existing: { event_id: string } | null;
  insertError: { code?: string; message?: string } | null;
};

function makeAdmin(table: ProcessedTable) {
  return {
    from: (name: string) => {
      if (name !== "processed_stripe_events") {
        throw new Error(`unexpected table ${name}`);
      }
      return {
        select: () => {
          table.selectCalls += 1;
          return {
            eq: () => ({
              maybeSingle: async () => ({ data: table.existing, error: null }),
            }),
          };
        },
        insert: async (row: Record<string, unknown>) => {
          table.insertCalls.push(row);
          return { error: table.insertError };
        },
      };
    },
  };
}

describe("POST /api/v1/billing/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    getAdminClient.mockReset();
    isWebhookConfigured.mockReset();
    verifyWebhookEvent.mockReset();
    handleCheckoutCompleted.mockReset();
    handleSubscriptionUpdated.mockReset();
    isWebhookConfigured.mockReturnValue(true);
  });

  it("does not mark processed when handler throws (Stripe can retry)", async () => {
    const table: ProcessedTable = {
      selectCalls: 0,
      insertCalls: [],
      existing: null,
      insertError: null,
    };
    getAdminClient.mockReturnValue(makeAdmin(table));
    verifyWebhookEvent.mockReturnValue({
      id: "evt_fail",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });
    handleSubscriptionUpdated.mockRejectedValue(new Error("db down"));

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      })
    );

    expect(res.status).toBe(500);
    expect(handleSubscriptionUpdated).toHaveBeenCalledOnce();
    expect(table.insertCalls).toEqual([]);
  });

  it("marks processed only after successful apply", async () => {
    const table: ProcessedTable = {
      selectCalls: 0,
      insertCalls: [],
      existing: null,
      insertError: null,
    };
    getAdminClient.mockReturnValue(makeAdmin(table));
    verifyWebhookEvent.mockReturnValue({
      id: "evt_ok",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          customer: "cus_1",
          client_reference_id: "tenant-1",
        },
      },
    });
    handleCheckoutCompleted.mockResolvedValue(undefined);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      })
    );

    expect(res.status).toBe(200);
    expect(handleCheckoutCompleted).toHaveBeenCalledOnce();
    expect(table.insertCalls).toEqual([{ event_id: "evt_ok" }]);
  });

  it("skips apply when event was already processed", async () => {
    const table: ProcessedTable = {
      selectCalls: 0,
      insertCalls: [],
      existing: { event_id: "evt_done" },
      insertError: null,
    };
    getAdminClient.mockReturnValue(makeAdmin(table));
    verifyWebhookEvent.mockReturnValue({
      id: "evt_done",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1", customer: "cus_1", status: "active" } },
    });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/v1/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      })
    );

    expect(res.status).toBe(200);
    expect(handleSubscriptionUpdated).not.toHaveBeenCalled();
    expect(table.insertCalls).toEqual([]);
  });
});
