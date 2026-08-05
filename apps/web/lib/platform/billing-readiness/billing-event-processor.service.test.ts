import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  processBillingEventRecord,
  processPendingBillingEvents,
  processTranslatedBillingEvent,
  translateBillingEventWithAdapter,
  reprocessBillingEvent,
  processPendingBillingEventsForWorkspace,
} from "./billing-event-processor.service";
import { sandboxBillingAdapter } from "./billing-adapter-sandbox";
import type { BillingEvent } from "./billing-readiness.types";
import type { BillingTranslatedEvent } from "./billing-event-processor.types";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("./billing-readiness.repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./billing-readiness.repository")>();
  return {
    ...actual,
    getBillingEventById: vi.fn(),
    getUnprocessedBillingEvents: vi.fn(),
    getUnprocessedBillingEventsForWorkspace: vi.fn(),
    getBillingCheckoutSession: vi.fn(),
    getBillingCheckoutSessionByProviderRef: vi.fn(),
    getCurrentBillingSubscription: vi.fn(),
    getBillingSubscriptionByProviderRef: vi.fn(),
    createBillingSubscription: vi.fn(),
    updateBillingCheckoutSessionStatus: vi.fn(),
    updateBillingSubscriptionStatus: vi.fn(),
    markBillingEventProcessed: vi.fn(),
    resetBillingEventToPending: vi.fn(),
  };
});

const {
  getBillingEventById,
  getUnprocessedBillingEvents,
  getUnprocessedBillingEventsForWorkspace,
  getBillingCheckoutSession,
  getBillingCheckoutSessionByProviderRef,
  getCurrentBillingSubscription,
  getBillingSubscriptionByProviderRef,
  createBillingSubscription,
  updateBillingCheckoutSessionStatus,
  updateBillingSubscriptionStatus,
  markBillingEventProcessed,
  resetBillingEventToPending,
} = await import("./billing-readiness.repository");

const noopSupabase = {} as SupabaseClient;

function makeEvent(overrides: Partial<BillingEvent> = {}): BillingEvent {
  return {
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
    ...overrides,
  };
}

describe("billing-event-processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("translateBillingEventWithAdapter", () => {
    it("translates sandbox.checkout.completed to checkout_complete hint", async () => {
      const event = makeEvent();
      const translated = await translateBillingEventWithAdapter(event, sandboxBillingAdapter);
      expect(translated).not.toBeNull();
      expect(translated!.reconciliationHint).toEqual({
        action: "checkout_complete",
        sessionId: "sess-1",
        planCode: "team_contractor",
        billingCycle: "monthly",
      });
    });

    it("translates sandbox.checkout.cancelled to checkout_cancel hint", async () => {
      const event = makeEvent({
        eventType: "sandbox.checkout.cancelled",
        eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1" },
      });
      const translated = await translateBillingEventWithAdapter(event, sandboxBillingAdapter);
      expect(translated).not.toBeNull();
      expect(translated!.reconciliationHint).toEqual({ action: "checkout_cancel", sessionId: "sess-1" });
    });

    it("returns null for unsupported event type", async () => {
      const event = makeEvent({ eventType: "unknown.event.type" });
      const translated = await translateBillingEventWithAdapter(event, sandboxBillingAdapter);
      expect(translated).toBeNull();
    });
  });

  describe("processBillingEventRecord", () => {
    it("returns noop when event not found", async () => {
      vi.mocked(getBillingEventById).mockResolvedValue(null);
      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Event not found");
    });

    it("returns noop when event already processed", async () => {
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent({ processingStatus: "processed" }));
      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("noop");
      expect(result.idempotentHit).toBe(true);
      expect(markBillingEventProcessed).not.toHaveBeenCalled();
    });

    it("processes checkout.completed and creates subscription", async () => {
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
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent());
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-1" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("processed");
      expect(result.updatedCheckoutSessionId).toBe("sess-1");
      expect(result.updatedSubscriptionId).toBe("sub-1");
      expect(updateBillingCheckoutSessionStatus).toHaveBeenCalledWith(noopSupabase, "sess-1", "completed");
      expect(createBillingSubscription).toHaveBeenCalled();
      expect(markBillingEventProcessed).toHaveBeenCalledWith(noopSupabase, "evt-1", "processed", undefined);
    });

    it("idempotent when session already completed and subscription exists", async () => {
      const session = {
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
      };
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent());
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue({ id: "sub-1" } as never);

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("processed");
      expect(result.idempotentHit).toBe(true);
      expect(updateBillingCheckoutSessionStatus).not.toHaveBeenCalled();
      expect(createBillingSubscription).not.toHaveBeenCalled();
    });

    it("recovers subscription when session completed but subscription missing", async () => {
      const session = {
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
      };
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent());
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-recovered" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("processed");
      expect(result.updatedSubscriptionId).toBe("sub-recovered");
      expect(result.idempotentHit).toBe(false);
      expect(createBillingSubscription).toHaveBeenCalled();
      expect(updateBillingCheckoutSessionStatus).not.toHaveBeenCalled();
    });

    it("fails when session not found for checkout_complete - no subscription mutation (Step 17)", async () => {
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent());
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(null);

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Session not found");
      expect(markBillingEventProcessed).toHaveBeenCalledWith(noopSupabase, "evt-1", "failed", "Session not found");
      expect(createBillingSubscription).not.toHaveBeenCalled();
    });

    it("processes checkout.cancelled", async () => {
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
      vi.mocked(getBillingEventById).mockResolvedValue(
        makeEvent({
          eventType: "sandbox.checkout.cancelled",
          eventPayloadSnapshot: { sessionId: "sess-1", workspaceId: "w1" },
        })
      );
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("processed");
      expect(result.updatedCheckoutSessionId).toBe("sess-1");
      expect(updateBillingCheckoutSessionStatus).toHaveBeenCalledWith(noopSupabase, "sess-1", "cancelled");
      expect(createBillingSubscription).not.toHaveBeenCalled();
    });

    it("skips unsupported event type", async () => {
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent({ eventType: "unknown.type" }));
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const result = await processBillingEventRecord(noopSupabase, "evt-1");
      expect(result.status).toBe("skipped");
      expect(markBillingEventProcessed).toHaveBeenCalledWith(noopSupabase, "evt-1", "skipped", expect.any(String));
    });
  });

  describe("Step 17: no access enforcement, billing_readiness only", () => {
    it("processor only updates billing_readiness state - no entitlements or plan-fit", async () => {
      const session = {
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
      };
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent());
      vi.mocked(getBillingCheckoutSession).mockResolvedValue(session);
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-1" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      await processBillingEventRecord(noopSupabase, "evt-1");

      expect(updateBillingCheckoutSessionStatus).toHaveBeenCalled();
      expect(createBillingSubscription).toHaveBeenCalled();
      expect(markBillingEventProcessed).toHaveBeenCalled();
    });
  });

  describe("processPendingBillingEvents", () => {
    it("processes batch of pending events", async () => {
      const ev1 = makeEvent({ id: "evt-1" });
      const ev2 = makeEvent({ id: "evt-2", eventType: "sandbox.checkout.cancelled", eventPayloadSnapshot: { sessionId: "sess-2", workspaceId: "w1" } });
      vi.mocked(getUnprocessedBillingEvents).mockResolvedValue([ev1, ev2]);
      vi.mocked(getBillingEventById)
        .mockResolvedValueOnce(ev1)
        .mockResolvedValueOnce(ev2);
      vi.mocked(getBillingCheckoutSession)
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({
          id: "sess-2",
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
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-1" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const results = await processPendingBillingEvents(noopSupabase, 10);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe("processed");
      expect(results[1].status).toBe("processed");
    });
  });

  describe("processTranslatedBillingEvent", () => {
    it("returns noop when event already processed", async () => {
      const event = makeEvent({ processingStatus: "processed" });
      const translated: BillingTranslatedEvent = {
        providerKind: "sandbox",
        providerEventRef: "ref",
        eventType: "sandbox.checkout.completed",
        workspaceId: "w1",
        checkoutSessionId: "sess-1",
        subscriptionId: null,
        targetPlanCode: "team_contractor",
        occurredAt: event.receivedAt,
        payload: event.eventPayloadSnapshot,
        reconciliationHint: { action: "checkout_complete", sessionId: "sess-1", planCode: "team_contractor", billingCycle: "monthly" },
      };
      const result = await processTranslatedBillingEvent(noopSupabase, event, translated);
      expect(result.status).toBe("noop");
      expect(result.idempotentHit).toBe(true);
      expect(markBillingEventProcessed).not.toHaveBeenCalled();
    });
  });

  describe("reprocessBillingEvent (Step 19)", () => {
    it("returns noop when event already processed", async () => {
      vi.mocked(getBillingEventById).mockResolvedValue(makeEvent({ processingStatus: "processed" }));
      const result = await reprocessBillingEvent(noopSupabase, "evt-1");
      expect(result.status).toBe("noop");
      expect(result.idempotentHit).toBe(true);
      expect(resetBillingEventToPending).not.toHaveBeenCalled();
    });

    it("resets failed event to pending then processes", async () => {
      const failedEvent = makeEvent({ processingStatus: "failed" });
      const pendingEvent = makeEvent({ processingStatus: "pending" });
      vi.mocked(getBillingEventById).mockResolvedValueOnce(failedEvent).mockResolvedValueOnce(pendingEvent);
      vi.mocked(resetBillingEventToPending).mockResolvedValue({ error: null });
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
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-1" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const result = await reprocessBillingEvent(noopSupabase, "evt-1");
      expect(resetBillingEventToPending).toHaveBeenCalledWith(noopSupabase, "evt-1");
      expect(result.status).toBe("processed");
    });
  });

  describe("processPendingBillingEventsForWorkspace (Step 19)", () => {
    it("processes only workspace events", async () => {
      const ev1 = makeEvent({ id: "evt-1", workspaceId: "w1" });
      vi.mocked(getUnprocessedBillingEventsForWorkspace).mockResolvedValue([ev1]);
      vi.mocked(getBillingEventById).mockResolvedValue(ev1);
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
      vi.mocked(updateBillingCheckoutSessionStatus).mockResolvedValue({ data: {} as never, error: null });
      vi.mocked(createBillingSubscription).mockResolvedValue({ data: { id: "sub-1" } as never, error: null });
      vi.mocked(markBillingEventProcessed).mockResolvedValue({ error: null });

      const results = await processPendingBillingEventsForWorkspace(noopSupabase, "w1");
      expect(getUnprocessedBillingEventsForWorkspace).toHaveBeenCalledWith(noopSupabase, "w1", true, 50);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("processed");
    });
  });
});
