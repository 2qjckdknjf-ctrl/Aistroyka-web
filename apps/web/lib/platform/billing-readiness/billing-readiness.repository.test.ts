import { describe, expect, it, vi } from "vitest";
import {
  getBillingCustomerByWorkspace,
  getCurrentBillingSubscription,
  createBillingEventRecord,
  markBillingEventProcessed,
  getBillingCheckoutSessionByProviderRef,
  updateBillingCheckoutSessionProviderRef,
  getBillingEventByProviderRef,
  getBillingSubscriptionByProviderRef,
} from "./billing-readiness.repository";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockSupabase(response: { data?: unknown; error?: { message: string } | null }) {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(response),
    single: vi.fn().mockResolvedValue(response),
  };
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue(response) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue(response) })) })) })),
    })),
  } as unknown as SupabaseClient;
}

describe("billing-readiness repository", () => {
  describe("getBillingCustomerByWorkspace", () => {
    it("returns null when no row", async () => {
      const supabase = mockSupabase({ data: null, error: null });
      const result = await getBillingCustomerByWorkspace(supabase, "w1");
      expect(result).toBeNull();
    });

    it("maps row to BillingCustomer", async () => {
      const supabase = mockSupabase({
        data: {
          workspace_id: "w1",
          provider_customer_ref: "cus_123",
          billing_email: "b@example.com",
          status: "active",
          meta: {},
          created_at: "2026-03-19T12:00:00Z",
          updated_at: "2026-03-19T12:00:00Z",
        },
        error: null,
      });
      const result = await getBillingCustomerByWorkspace(supabase, "w1");
      expect(result).not.toBeNull();
      expect(result?.workspaceId).toBe("w1");
      expect(result?.providerCustomerRef).toBe("cus_123");
      expect(result?.billingEmail).toBe("b@example.com");
    });
  });

  describe("getCurrentBillingSubscription", () => {
    it("returns null when no row", async () => {
      const supabase = mockSupabase({ data: null, error: null });
      const result = await getCurrentBillingSubscription(supabase, "w1");
      expect(result).toBeNull();
    });
  });

  describe("createBillingEventRecord", () => {
    it("creates event with pending status", async () => {
      const supabase = mockSupabase({
        data: {
          id: "evt-1",
          workspace_id: "w1",
          billing_provider: "none",
          provider_event_ref: "ref-1",
          event_type: "test.created",
          event_payload_snapshot: {},
          processing_status: "pending",
          processed_at: null,
          received_at: "2026-03-19T12:00:00Z",
          error_info: null,
        },
        error: null,
      });
      const { data, error } = await createBillingEventRecord(supabase, {
        workspaceId: "w1",
        billingProvider: "none",
        providerEventRef: "ref-1",
        eventType: "test.created",
      });
      expect(error).toBeNull();
      expect(data?.id).toBe("evt-1");
      expect(data?.processingStatus).toBe("pending");
    });
  });

  describe("markBillingEventProcessed", () => {
    it("updates event status", async () => {
      const updateChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => updateChain),
        })),
      } as unknown as SupabaseClient;
      const { error } = await markBillingEventProcessed(supabase, "evt-1", "processed");
      expect(error).toBeNull();
    });
  });

  describe("getBillingCheckoutSessionByProviderRef", () => {
    it("returns null when no row", async () => {
      const supabase = mockSupabase({ data: null, error: null });
      const result = await getBillingCheckoutSessionByProviderRef(supabase, "cs_xxx");
      expect(result).toBeNull();
    });

    it("returns session when found by provider ref", async () => {
      const supabase = mockSupabase({
        data: {
          id: "sess-1",
          workspace_id: "w1",
          target_plan_code: "team_contractor",
          requested_billing_cycle: "monthly",
          status: "pending_redirect",
          provider_session_ref: "cs_xxx",
          return_url: "https://a.com",
          cancel_url: "https://a.com",
          created_by_user_id: null,
          created_at: "2026-03-19T12:00:00Z",
          expires_at: null,
          metadata: {},
        },
        error: null,
      });
      const result = await getBillingCheckoutSessionByProviderRef(supabase, "cs_xxx");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("sess-1");
      expect(result?.providerSessionRef).toBe("cs_xxx");
    });
  });

  describe("updateBillingCheckoutSessionProviderRef", () => {
    it("updates provider ref", async () => {
      const supabase = mockSupabase({
        data: {
          id: "sess-1",
          provider_session_ref: "cs_new",
        },
        error: null,
      });
      const { error } = await updateBillingCheckoutSessionProviderRef(supabase, "sess-1", "cs_new");
      expect(error).toBeNull();
    });
  });

  describe("getBillingEventByProviderRef (Step 17)", () => {
    it("returns null when no row", async () => {
      const supabase = mockSupabase({ data: null, error: null });
      const result = await getBillingEventByProviderRef(supabase, "stripe", "evt_1");
      expect(result).toBeNull();
    });

    it("returns event when found", async () => {
      const supabase = mockSupabase({
        data: {
          id: "evt-1",
          workspace_id: "w1",
          billing_provider: "stripe",
          provider_event_ref: "evt_1",
          event_type: "checkout.session.completed",
          event_payload_snapshot: {},
          processing_status: "pending",
          processed_at: null,
          received_at: "2026-03-19T12:00:00Z",
          error_info: null,
        },
        error: null,
      });
      const result = await getBillingEventByProviderRef(supabase, "stripe", "evt_1");
      expect(result).not.toBeNull();
      expect(result?.providerEventRef).toBe("evt_1");
    });
  });

  describe("getBillingSubscriptionByProviderRef (Step 17)", () => {
    it("returns null when no row", async () => {
      const supabase = mockSupabase({ data: null, error: null });
      const result = await getBillingSubscriptionByProviderRef(supabase, "sub_xxx");
      expect(result).toBeNull();
    });

    it("returns subscription when found", async () => {
      const supabase = mockSupabase({
        data: {
          id: "sub-1",
          workspace_id: "w1",
          canonical_plan_code: "team_contractor",
          billing_provider: "stripe",
          provider_subscription_ref: "sub_xxx",
          status: "active",
          billing_cycle: "monthly",
          trial_status: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          started_at: "2026-03-19T12:00:00Z",
          ended_at: null,
          created_at: "2026-03-19T12:00:00Z",
          updated_at: "2026-03-19T12:00:00Z",
        },
        error: null,
      });
      const result = await getBillingSubscriptionByProviderRef(supabase, "sub_xxx");
      expect(result).not.toBeNull();
      expect(result?.workspaceId).toBe("w1");
      expect(result?.providerSubscriptionRef).toBe("sub_xxx");
    });
  });
});
