import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ingestStripeWebhook } from "./stripe-webhook-ingress.service";

vi.mock("./stripe-webhook-verification", () => ({
  verifyStripeWebhookSignature: vi.fn(),
  isStripeWebhookIngressReady: vi.fn(),
}));

vi.mock("./billing-readiness.repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./billing-readiness.repository")>();
  return {
    ...actual,
    getBillingEventByProviderRef: vi.fn(),
    createBillingEventRecord: vi.fn(),
  };
});

vi.mock("./billing-event-processor.service", () => ({
  processBillingEventRecord: vi.fn(),
}));

vi.mock("./billing-pilot-resolution.service", () => ({
  resolveBillingPilotEligibility: vi.fn(),
}));

const { verifyStripeWebhookSignature, isStripeWebhookIngressReady } = await import("./stripe-webhook-verification");
const { getBillingEventByProviderRef, createBillingEventRecord } = await import("./billing-readiness.repository");
const { processBillingEventRecord } = await import("./billing-event-processor.service");
const { resolveBillingPilotEligibility } = await import("./billing-pilot-resolution.service");

const noopSupabase = {} as SupabaseClient;

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

describe("stripe-webhook-ingress.service (Step 17)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.mocked(isStripeWebhookIngressReady).mockReturnValue(true);
    vi.mocked(getBillingEventByProviderRef).mockResolvedValue(null);
    vi.mocked(resolveBillingPilotEligibility).mockResolvedValue({
      liveCheckoutEligible: true,
      webhookProcessingEligible: true,
      mode: "provider_live",
      reason: "pilot_cohort_eligible",
      fallbackMode: "provider_stub",
      inPilotCohort: true,
    });
    vi.mocked(createBillingEventRecord).mockResolvedValue({
      data: {
        id: "evt-1",
        workspaceId: "w1",
        billingProvider: "stripe",
        providerEventRef: "evt_stripe_1",
        eventType: "checkout.session.completed",
        eventPayloadSnapshot: {},
        processingStatus: "pending",
        processedAt: null,
        receivedAt: new Date().toISOString(),
        errorInfo: null,
      },
      error: null,
    });
    vi.mocked(processBillingEventRecord).mockResolvedValue({
      status: "processed",
      eventId: "evt-1",
      updatedSubscriptionId: null,
      updatedCheckoutSessionId: null,
      notes: [],
      idempotentHit: false,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects when webhook ingress not ready", async () => {
    vi.mocked(isStripeWebhookIngressReady).mockReturnValue(false);
    const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
    expect(result.status).toBe("rejected");
    expect(result.reason).toMatch(/not enabled|config invalid/i);
  });

  it("rejects when signature invalid", async () => {
    vi.mocked(verifyStripeWebhookSignature).mockReturnValue(null);
    const result = await ingestStripeWebhook(noopSupabase, "{}", "bad_sig");
    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("Invalid signature");
  });

  it("returns duplicate when event already exists - no record or process, no subscription mutation", async () => {
    vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: {} },
    } as never);
    vi.mocked(getBillingEventByProviderRef).mockResolvedValue({
      id: "evt-existing",
      workspaceId: "w1",
      billingProvider: "stripe",
      providerEventRef: "evt_1",
      eventType: "checkout.session.completed",
      eventPayloadSnapshot: {},
      processingStatus: "processed",
      processedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      errorInfo: null,
    });
    const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
    expect(result.status).toBe("duplicate");
    expect(result.eventId).toBe("evt-existing");
    expect(createBillingEventRecord).not.toHaveBeenCalled();
    expect(processBillingEventRecord).not.toHaveBeenCalled();
  });

  it("skips unsupported event type - no record or process", async () => {
    vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
      id: "evt_1",
      type: "invoice.payment_failed",
      data: { object: {} },
    } as never);
    const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
    expect(result.status).toBe("skipped");
    expect(result.reason).toMatch(/Unsupported/);
    expect(createBillingEventRecord).not.toHaveBeenCalled();
    expect(processBillingEventRecord).not.toHaveBeenCalled();
  });

  it("processes supported event and returns processed", async () => {
    vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: { workspace_id: "w1", target_plan_code: "team_contractor", billing_cycle: "monthly" },
        },
      },
    } as never);
    const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
    expect(result.status).toBe("processed");
    expect(result.eventId).toBe("evt-1");
    expect(createBillingEventRecord).toHaveBeenCalled();
    expect(processBillingEventRecord).toHaveBeenCalled();
  });

  it("missing workspace/session mapping: processor returns failed, no subscription mutation", async () => {
    vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_unknown",
          metadata: { workspace_id: "w1", target_plan_code: "team_contractor", billing_cycle: "monthly" },
        },
      },
    } as never);
    vi.mocked(processBillingEventRecord).mockResolvedValue({
      status: "failed",
      eventId: "evt-1",
      updatedSubscriptionId: null,
      updatedCheckoutSessionId: null,
      notes: ["Session not found"],
      idempotentHit: false,
      error: "Session not found",
    });
    vi.mocked(processBillingEventRecord).mockClear();
    const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
    expect(result.status).toBe("processed");
    expect(result.processingStatus).toBe("failed");
    expect(createBillingEventRecord).toHaveBeenCalled();
    expect(processBillingEventRecord).toHaveBeenCalled();
  });

  describe("Step 18: pilot gating", () => {
    beforeEach(() => {
      vi.mocked(processBillingEventRecord).mockClear();
    });
    it("skips webhook processing when workspace not pilot-eligible", async () => {
      vi.mocked(resolveBillingPilotEligibility).mockResolvedValue({
        liveCheckoutEligible: false,
        webhookProcessingEligible: false,
        mode: "provider_stub",
        reason: "workspace_not_allowlisted",
        fallbackMode: "provider_stub",
        inPilotCohort: false,
      });
      vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
        id: "evt_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_1",
            metadata: { workspace_id: "w1" },
          },
        },
      } as never);
      const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
      expect(result.status).toBe("processed");
      expect(result.processingStatus).toBe("skipped_pilot_not_eligible");
      expect(createBillingEventRecord).toHaveBeenCalled();
      expect(processBillingEventRecord).not.toHaveBeenCalled();
    });

    it("skips webhook processing when workspace missing from event", async () => {
      vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
        id: "evt_1",
        type: "checkout.session.completed",
        data: { object: {} },
      } as never);
      const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
      expect(result.status).toBe("processed");
      expect(result.processingStatus).toBe("skipped_missing_workspace");
      expect(createBillingEventRecord).toHaveBeenCalled();
      expect(processBillingEventRecord).not.toHaveBeenCalled();
    });

    it("processes webhook when workspace is pilot-eligible", async () => {
      vi.mocked(resolveBillingPilotEligibility).mockResolvedValue({
        liveCheckoutEligible: true,
        webhookProcessingEligible: true,
        mode: "provider_live",
        reason: "pilot_cohort_eligible",
        fallbackMode: "provider_stub",
        inPilotCohort: true,
      });
      vi.mocked(verifyStripeWebhookSignature).mockReturnValue({
        id: "evt_1",
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { workspace_id: "w1" },
          },
        },
      } as never);
      const result = await ingestStripeWebhook(noopSupabase, "{}", "sig");
      expect(result.status).toBe("processed");
      expect(result.processingStatus).toBe("processed");
      expect(processBillingEventRecord).toHaveBeenCalled();
    });
  });
});
