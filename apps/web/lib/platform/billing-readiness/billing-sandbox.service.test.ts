import { describe, expect, it, vi } from "vitest";
import { completeSandboxCheckout, cancelSandboxCheckout } from "./billing-sandbox.service";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("./billing-readiness.repository", () => ({
  getBillingCheckoutSession: vi.fn(),
  getBillingEventById: vi.fn(),
  updateBillingCheckoutSessionStatus: vi.fn(),
  createBillingSubscription: vi.fn(),
  getCurrentBillingSubscription: vi.fn(),
  createBillingEventRecord: vi.fn(),
  markBillingEventProcessed: vi.fn(),
}));

const {
  getBillingCheckoutSession,
  getBillingEventById,
  updateBillingCheckoutSessionStatus,
  createBillingSubscription,
  getCurrentBillingSubscription,
  createBillingEventRecord,
  markBillingEventProcessed,
} = await import("./billing-readiness.repository");

const noopSupabase = {} as SupabaseClient;

describe("billing-sandbox service", () => {
  describe("completeSandboxCheckout", () => {
    it("returns error when session not found", async () => {
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(null);
      const { success, error } = await completeSandboxCheckout(noopSupabase, "sess-1");
      expect(success).toBe(false);
      expect(error).toBe("Session not found");
    });

    it("returns success when session already completed", async () => {
      vi.mocked(getBillingCheckoutSession).mockResolvedValue({
        id: "sess-1",
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        status: "completed",
        providerSessionRef: null,
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        createdByUserId: null,
        createdAt: "",
        expiresAt: null,
        metadata: {},
      });
      const { success } = await completeSandboxCheckout(noopSupabase, "sess-1");
      expect(success).toBe(true);
    });

    it("completes session and creates subscription when none exists", async () => {
      const session = {
        id: "sess-1",
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        status: "created",
        providerSessionRef: null,
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        createdByUserId: null,
        createdAt: "",
        expiresAt: null,
        metadata: {},
      };
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(createBillingEventRecord).mockResolvedValue({
        data: {
          id: "evt-1",
          workspaceId: "w1",
          billingProvider: "sandbox",
          providerEventRef: "sandbox_checkout_sess-1_1",
          eventType: "sandbox.checkout.completed",
          eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1", planCode: "team_contractor", billingCycle: "monthly" },
          processingStatus: "pending",
          processedAt: null,
          receivedAt: new Date().toISOString(),
          errorInfo: null,
        } as never,
        error: null,
      });
      vi.mocked(getBillingEventById).mockResolvedValue({
        id: "evt-1",
        workspaceId: "w1",
        billingProvider: "sandbox",
        providerEventRef: "sandbox_checkout_sess-1_1",
        eventType: "sandbox.checkout.completed",
        eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1", planCode: "team_contractor", billingCycle: "monthly" },
        processingStatus: "pending",
        processedAt: null,
        receivedAt: new Date().toISOString(),
        errorInfo: null,
      });
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const { success } = await completeSandboxCheckout(noopSupabase, "sess-1");
      expect(success).toBe(true);
    });
  });

  describe("cancelSandboxCheckout", () => {
    it("returns error when session not found", async () => {
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(null);
      const { success, error } = await cancelSandboxCheckout(noopSupabase, "sess-1");
      expect(success).toBe(false);
      expect(error).toBe("Session not found");
    });

    it("cancels session and records event", async () => {
      vi.mocked(getBillingCheckoutSession).mockResolvedValue({
        id: "sess-1",
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        status: "created",
        providerSessionRef: null,
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        createdByUserId: null,
        createdAt: "",
        expiresAt: null,
        metadata: {},
      });
      vi.mocked(createBillingEventRecord).mockResolvedValue({
        data: { id: "evt-1" } as never,
        error: null,
      });
      vi.mocked(getBillingEventById).mockResolvedValue({
        id: "evt-1",
        workspaceId: "w1",
        billingProvider: "sandbox",
        providerEventRef: "sandbox_checkout_cancel_sess-1_1",
        eventType: "sandbox.checkout.cancelled",
        eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1" },
        processingStatus: "pending",
        processedAt: null,
        receivedAt: new Date().toISOString(),
        errorInfo: null,
      });
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const { success } = await cancelSandboxCheckout(noopSupabase, "sess-1");
      expect(success).toBe(true);
    });

    describe("Step 17: sandbox flow intact, uses canonical processor", () => {
      it("sandbox complete flows through processBillingEventRecord", async () => {
        vi.mocked(getBillingCheckoutSession).mockResolvedValue({
          id: "sess-1",
          workspaceId: "w1",
          targetPlanCode: "team_contractor",
          requestedBillingCycle: "monthly",
          status: "created",
          providerSessionRef: null,
          returnUrl: "",
          cancelUrl: "",
          createdByUserId: null,
          createdAt: "",
          expiresAt: null,
          metadata: {},
        });
        vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
        vi.mocked(createBillingEventRecord).mockResolvedValue({
          data: {
            id: "evt-1",
            workspaceId: "w1",
            billingProvider: "sandbox",
            providerEventRef: "sandbox_checkout_sess-1_1",
            eventType: "sandbox.checkout.completed",
            eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1", planCode: "team_contractor", billingCycle: "monthly" },
            processingStatus: "pending",
            processedAt: null,
            receivedAt: new Date().toISOString(),
            errorInfo: null,
          } as never,
          error: null,
        });
        vi.mocked(getBillingEventById).mockResolvedValue({
          id: "evt-1",
          workspaceId: "w1",
          billingProvider: "sandbox",
          providerEventRef: "sandbox_checkout_sess-1_1",
          eventType: "sandbox.checkout.completed",
          eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1", planCode: "team_contractor", billingCycle: "monthly" },
          processingStatus: "pending",
          processedAt: null,
          receivedAt: new Date().toISOString(),
          errorInfo: null,
        });
        vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
        vi.mocked(createBillingSubscription).mockResolvedValue({ data: {} as never, error: null });
        vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

        const { success } = await completeSandboxCheckout(noopSupabase, "sess-1");
        expect(success).toBe(true);
        expect(createBillingEventRecord).toHaveBeenCalledWith(noopSupabase, expect.objectContaining({ eventType: "sandbox.checkout.completed" }));
      });

      it("sandbox cancel flows through processBillingEventRecord", async () => {
        vi.mocked(getBillingCheckoutSession).mockResolvedValue({
          id: "sess-1",
          workspaceId: "w1",
          targetPlanCode: "team_contractor",
          requestedBillingCycle: "monthly",
          status: "created",
          providerSessionRef: null,
          returnUrl: "",
          cancelUrl: "",
          createdByUserId: null,
          createdAt: "",
          expiresAt: null,
          metadata: {},
        });
        vi.mocked(createBillingEventRecord).mockResolvedValue({
          data: { id: "evt-1" } as never,
          error: null,
        });
        vi.mocked(getBillingEventById).mockResolvedValue({
          id: "evt-1",
          workspaceId: "w1",
          billingProvider: "sandbox",
          providerEventRef: "sandbox_checkout_cancel_sess-1_1",
          eventType: "sandbox.checkout.cancelled",
          eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1" },
          processingStatus: "pending",
          processedAt: null,
          receivedAt: new Date().toISOString(),
          errorInfo: null,
        });
        vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
        vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

        const { success } = await cancelSandboxCheckout(noopSupabase, "sess-1");
        expect(success).toBe(true);
        expect(createBillingEventRecord).toHaveBeenCalledWith(noopSupabase, expect.objectContaining({ eventType: "sandbox.checkout.cancelled" }));
      });
    });
  });
});
