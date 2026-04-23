/**
 * Tests for E2E pilot execution status service (Step 20).
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { BillingCheckoutSession, BillingSubscription, BillingEvent } from "./billing-readiness.types";
import {
  resolveBillingPilotExecutionStage,
  getBillingPilotOperatorActions,
  getBillingPilotExecutionStatus,
} from "./billing-pilot-execution.service";
import type { BillingPilotExecutionStatus } from "./billing-pilot-execution.types";

vi.mock("./billing-pilot-resolution.service", () => ({
  getBillingPilotDiagnostics: vi.fn(),
}));
vi.mock("./billing-adapter-registry", () => ({
  getBillingAdapterDiagnostics: vi.fn(() => ({
    activeAdapterKind: "sandbox",
    checkoutMode: "sandbox_simulation",
  })),
}));
vi.mock("./billing-readiness.repository", () => ({
  getLatestBillingCheckoutSessionByWorkspace: vi.fn(),
  getCurrentBillingSubscription: vi.fn(),
  getBillingEventsByWorkspace: vi.fn(),
  getBillingEventCountsByWorkspace: vi.fn(),
}));

const { getBillingPilotDiagnostics } = await import("./billing-pilot-resolution.service");
const repo = await import("./billing-readiness.repository");

const noopSupabase = {} as Parameters<typeof getBillingPilotExecutionStatus>[0];

function mockCheckout(overrides: Partial<BillingCheckoutSession> = {}): BillingCheckoutSession {
  return {
    id: "cs1",
    workspaceId: "w1",
    targetPlanCode: "team_contractor",
    requestedBillingCycle: "monthly",
    status: "created",
    providerSessionRef: "cs_stripe_xxx",
    returnUrl: "/billing/return",
    cancelUrl: "/billing/cancel",
    createdByUserId: null,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    metadata: {},
    ...overrides,
  };
}

function mockSubscription(overrides: Partial<BillingSubscription> = {}): BillingSubscription {
  return {
    id: "sub1",
    workspaceId: "w1",
    canonicalPlanCode: "team_contractor",
    billingProvider: "stripe",
    providerSubscriptionRef: "sub_stripe_xxx",
    status: "active",
    billingCycle: "monthly",
    trialStatus: null,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    startedAt: new Date().toISOString(),
    endedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockEvent(overrides: Partial<BillingEvent> = {}): BillingEvent {
  return {
    id: "ev1",
    workspaceId: "w1",
    billingProvider: "stripe",
    providerEventRef: "ev_stripe_xxx",
    eventType: "checkout.session.completed",
    eventPayloadSnapshot: {},
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    errorInfo: null,
    ...overrides,
  };
}

describe("billing-pilot-execution.service (Step 20)", () => {
  beforeEach(() => {
    vi.mocked(getBillingPilotDiagnostics).mockResolvedValue({
      workspaceId: "w1",
      inPilotCohort: true,
      liveCheckoutEligible: true,
      webhookProcessingEligible: true,
      mode: "provider_live",
      reason: "pilot_cohort_eligible",
      globalProviderEnabled: true,
      globalLiveCheckoutEnabled: true,
      globalWebhookIngressEnabled: true,
      configValid: true,
    });
    vi.mocked(repo.getLatestBillingCheckoutSessionByWorkspace).mockResolvedValue(null);
    vi.mocked(repo.getCurrentBillingSubscription).mockResolvedValue(null);
    vi.mocked(repo.getBillingEventsByWorkspace).mockResolvedValue([]);
    vi.mocked(repo.getBillingEventCountsByWorkspace).mockResolvedValue({
      pending: 0,
      processed: 0,
      failed: 0,
      skipped: 0,
    });
  });

  describe("resolveBillingPilotExecutionStage", () => {
    it("returns pilot_not_eligible when not in cohort", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: false,
        pilotEligible: false,
        mode: "provider_stub",
        latestCheckout: null,
        currentSubscription: null,
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("pilot_not_eligible");
      expect(result.suggestedAction).toBe("confirm_pilot_cohort");
    });

    it("returns ready_for_checkout when provider_stub", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: false,
        mode: "provider_stub",
        latestCheckout: null,
        currentSubscription: null,
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("ready_for_checkout");
      expect(result.suggestedAction).toBe("see_adapter_mode");
    });

    it("returns pilot_needs_attention when failed events", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: true,
        mode: "provider_live",
        latestCheckout: null,
        currentSubscription: null,
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 1, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("pilot_needs_attention");
      expect(result.attentionReasons).toContain("failed_events_pending");
      expect(result.suggestedAction).toBe("reprocess_failed_event");
    });

    it("returns cancelled when checkout cancelled", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: true,
        mode: "provider_live",
        latestCheckout: mockCheckout({ status: "cancelled" }),
        currentSubscription: null,
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("cancelled");
    });

    it("returns awaiting_provider_completion when checkout created with provider ref", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: true,
        mode: "provider_live",
        latestCheckout: mockCheckout({ status: "created", providerSessionRef: "cs_xxx" }),
        currentSubscription: null,
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("awaiting_provider_completion");
      expect(result.suggestedAction).toBe("await_webhook");
    });

    it("returns pilot_verified when checkout completed and subscription active", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: true,
        mode: "provider_live",
        latestCheckout: mockCheckout({ status: "completed" }),
        currentSubscription: mockSubscription({ status: "active" }),
        recentEvents: [mockEvent()],
        eventCounts: { pending: 0, processed: 1, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("pilot_verified");
      expect(result.suggestedAction).toBe("no_action");
    });

    it("returns pilot_verified when subscription active without latest checkout", () => {
      const result = resolveBillingPilotExecutionStage({
        inPilotCohort: true,
        pilotEligible: true,
        mode: "provider_live",
        latestCheckout: null,
        currentSubscription: mockSubscription({ status: "active" }),
        recentEvents: [],
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        lastFailureReason: null,
      });
      expect(result.stage).toBe("pilot_verified");
    });
  });

  describe("getBillingPilotOperatorActions", () => {
    it("includes inspect_diagnostics and see_adapter_mode always", () => {
      const status: BillingPilotExecutionStatus = {
        workspaceId: "w1",
        stage: "ready_for_checkout",
        mode: "provider_live",
        pilotEligible: true,
        latestCheckout: null,
        currentSubscription: null,
        latestRelevantEvent: null,
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        attentionReasons: [],
        suggestedOperatorAction: "no_action",
        suggestedOperatorHint: null,
        lastFailureReason: null,
        isSandbox: false,
      };
      const actions = getBillingPilotOperatorActions(status);
      expect(actions).toContain("inspect_diagnostics");
      expect(actions).toContain("see_adapter_mode");
    });

    it("includes reprocess_failed_event when failed events", () => {
      const status: BillingPilotExecutionStatus = {
        workspaceId: "w1",
        stage: "pilot_needs_attention",
        mode: "provider_live",
        pilotEligible: true,
        latestCheckout: null,
        currentSubscription: null,
        latestRelevantEvent: null,
        eventCounts: { pending: 0, processed: 0, failed: 1, skipped: 0 },
        attentionReasons: ["failed_events_pending"],
        suggestedOperatorAction: "reprocess_failed_event",
        suggestedOperatorHint: null,
        lastFailureReason: null,
        isSandbox: false,
      };
      const actions = getBillingPilotOperatorActions(status);
      expect(actions).toContain("reprocess_failed_event");
    });

    it("includes start_checkout when ready and provider_live", () => {
      const status: BillingPilotExecutionStatus = {
        workspaceId: "w1",
        stage: "ready_for_checkout",
        mode: "provider_live",
        pilotEligible: true,
        latestCheckout: null,
        currentSubscription: null,
        latestRelevantEvent: null,
        eventCounts: { pending: 0, processed: 0, failed: 0, skipped: 0 },
        attentionReasons: [],
        suggestedOperatorAction: "no_action",
        suggestedOperatorHint: null,
        lastFailureReason: null,
        isSandbox: false,
      };
      const actions = getBillingPilotOperatorActions(status);
      expect(actions).toContain("start_checkout");
    });
  });

  describe("getBillingPilotExecutionStatus", () => {
    it("returns execution status with stage for pilot workspace", async () => {
      vi.mocked(repo.getLatestBillingCheckoutSessionByWorkspace).mockResolvedValue(null);
      vi.mocked(repo.getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(repo.getBillingEventsByWorkspace).mockResolvedValue([]);
      vi.mocked(repo.getBillingEventCountsByWorkspace).mockResolvedValue({
        pending: 0,
        processed: 0,
        failed: 0,
        skipped: 0,
      });

      const result = await getBillingPilotExecutionStatus(noopSupabase, "w1");
      expect(result.workspaceId).toBe("w1");
      expect(result.stage).toBe("ready_for_checkout");
      expect(result.mode).toBe("provider_live");
      expect(result.pilotEligible).toBe(true);
      expect(result.isSandbox).toBe(false);
    });

    it("returns isSandbox true when mode is sandbox", async () => {
      vi.mocked(getBillingPilotDiagnostics).mockResolvedValue({
        workspaceId: "w1",
        inPilotCohort: true,
        liveCheckoutEligible: false,
        webhookProcessingEligible: false,
        mode: "sandbox",
        reason: "feature_flag_disabled",
        globalProviderEnabled: false,
        globalLiveCheckoutEnabled: false,
        globalWebhookIngressEnabled: false,
        configValid: false,
      });

      const result = await getBillingPilotExecutionStatus(noopSupabase, "w1");
      expect(result.isSandbox).toBe(true);
    });
  });
});
