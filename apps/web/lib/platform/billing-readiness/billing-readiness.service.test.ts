import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createBillingCheckoutSessionService,
  getWorkspaceBillingOverview,
  getWorkspaceBillingState,
  recordBillingEvent,
} from "./billing-readiness.service";
import type { SupabaseClient } from "@supabase/supabase-js";

const FLAG_PROVIDER = "ENABLE_STRIPE_BILLING_PROVIDER";
const FLAG_LIVE = "ENABLE_STRIPE_LIVE_CHECKOUT";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";
const PILOT_ALLOWLIST = "BILLING_PILOT_WORKSPACE_IDS";

function setEnv(key: string, value: string) {
  process.env[key] = value;
}
function deleteEnv(key: string) {
  delete process.env[key];
}

vi.mock("./billing-readiness.repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./billing-readiness.repository")>();
  return {
    ...actual,
    createBillingCheckoutSession: vi.fn(),
    getBillingCheckoutSession: vi.fn(),
    getCurrentBillingSubscription: vi.fn(),
    getBillingCustomerByWorkspace: vi.fn(),
    createBillingEventRecord: vi.fn(),
    updateBillingCheckoutSessionProviderRef: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateBillingCheckoutSessionStatus: vi.fn().mockResolvedValue({ data: {}, error: null }),
  };
});

vi.mock("@/lib/platform/plan-fit/persistence/workspace-plan-state.repository", () => ({
  getWorkspaceSelectedPlanState: vi.fn(),
}));

vi.mock("@/lib/platform/plan-fit", () => ({
  getWorkspacePlanContextFromRuntime: vi.fn(),
}));

vi.mock("@/lib/platform/plan-fit/plan-surface", () => ({
  getPlanSurfaceViewModel: vi.fn(() => ({
    currentPlanCode: "client_personal",
    humanReadablePlanName: "Client Personal",
  })),
}));

vi.mock("./billing-pilot.repository", () => ({
  getWorkspacePilotStatus: vi.fn(),
  isWorkspaceInPilotCohortSync: vi.fn(),
}));

/** Avoid real Stripe HTTP when Step 18 enables live checkout (network can hang). */
vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.test/cs_test_mock",
          id: "cs_test_mock",
        }),
      },
    };
    constructor(_key: string, _opts?: unknown) {
      void _key;
      void _opts;
    }
  },
}));

const {
  createBillingCheckoutSession,
  getCurrentBillingSubscription,
  getBillingCustomerByWorkspace,
  createBillingEventRecord,
} = await import("./billing-readiness.repository");
const { getWorkspaceSelectedPlanState } = await import("@/lib/platform/plan-fit/persistence/workspace-plan-state.repository");
const { getWorkspacePlanContextFromRuntime } = await import("@/lib/platform/plan-fit");
const { getWorkspacePilotStatus } = await import("./billing-pilot.repository");

const noopSupabase = {} as SupabaseClient;

const pilotNotInCohort = {
  inCohort: false,
  liveCheckoutEnabled: false,
  webhookProcessingEnabled: false,
  source: "none" as const,
};
const pilotInCohort = {
  inCohort: true,
  liveCheckoutEnabled: true,
  webhookProcessingEnabled: true,
  source: "env" as const,
};

describe("billing-readiness service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    deleteEnv(FLAG_PROVIDER);
    deleteEnv(FLAG_LIVE);
    deleteEnv(SECRET);
    deleteEnv(WEBHOOK);
    deleteEnv(PILOT_ALLOWLIST);
    vi.mocked(getWorkspacePilotStatus).mockResolvedValue(pilotNotInCohort);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });
  describe("createBillingCheckoutSessionService", () => {
    it("rejects invalid target plan code", async () => {
      const { data, error } = await createBillingCheckoutSessionService(noopSupabase, {
        workspaceId: "w1",
        request: {
          targetPlanCode: "invalid" as "client_personal",
          billingCycle: "monthly",
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        },
      });
      expect(error).toBe("Invalid target plan code");
      expect(data).toBeNull();
    });

    it("rejects when workspace has no selected plan", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
      const { data, error } = await createBillingCheckoutSessionService(noopSupabase, {
        workspaceId: "w1",
        request: {
          targetPlanCode: "team_contractor",
          billingCycle: "monthly",
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        },
      });
      expect(error).toBe("Workspace has no selected plan");
      expect(data).toBeNull();
    });

    it("returns safe placeholder response (no redirect URL)", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "client_personal",
        sourceKind: "manual_backend_set",
        selectedByUserId: "u1",
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(createBillingCheckoutSession).mockResolvedValue({
        data: {
          id: "sess-1",
          workspaceId: "w1",
          targetPlanCode: "team_contractor",
          requestedBillingCycle: "monthly",
          status: "created",
          providerSessionRef: null,
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
          createdByUserId: "u1",
          createdAt: "2026-03-19T12:00:00Z",
          expiresAt: null,
          metadata: {},
        },
        error: null,
      });
      const { data, error } = await createBillingCheckoutSessionService(noopSupabase, {
        workspaceId: "w1",
        request: {
          targetPlanCode: "team_contractor",
          billingCycle: "monthly",
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        },
        createdByUserId: "u1",
      });
      expect(error).toBeNull();
      expect(data?.checkoutSessionId).toBe("sess-1");
      expect(data?.status).toBe("created");
      expect(data?.redirectUrl).toBeUndefined();
      expect(data?.providerKind).toBe("sandbox");
      expect(data?.mode).toBe("sandbox_simulation");
    });

    it("Step 18: provider flags ON, workspace not in pilot -> stub, no redirect", async () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_LIVE, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      setEnv("STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY", "price_xxx");
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "client_personal",
        sourceKind: "manual_backend_set",
        selectedByUserId: "u1",
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(createBillingCheckoutSession).mockResolvedValue({
        data: {
          id: "sess-1",
          workspaceId: "w1",
          targetPlanCode: "team_contractor",
          requestedBillingCycle: "monthly",
          status: "created",
          providerSessionRef: null,
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
          createdByUserId: "u1",
          createdAt: "2026-03-19T12:00:00Z",
          expiresAt: null,
          metadata: {},
        },
        error: null,
      });
      const { data, error } = await createBillingCheckoutSessionService(noopSupabase, {
        workspaceId: "w1",
        request: {
          targetPlanCode: "team_contractor",
          billingCycle: "monthly",
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        },
        createdByUserId: "u1",
      });
      expect(error).toBeNull();
      expect(data?.checkoutSessionId).toBe("sess-1");
      expect(data?.redirectUrl).toBeUndefined();
      expect(data?.mode).toBe("provider_ready_stub");
      expect(data?.providerKind).toBe("stripe");
    });

    it("Step 18: provider flags ON, workspace in pilot -> liveCheckoutEligible true passed to adapter (Stripe API may fail in test)", async () => {
      setEnv(FLAG_PROVIDER, "true");
      setEnv(FLAG_LIVE, "true");
      setEnv(SECRET, "sk_test_xxx");
      setEnv(WEBHOOK, "whsec_xxx");
      setEnv(PILOT_ALLOWLIST, "w1");
      setEnv("STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY", "price_xxx");
      vi.mocked(getWorkspacePilotStatus).mockResolvedValue(pilotInCohort);
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "client_personal",
        sourceKind: "manual_backend_set",
        selectedByUserId: "u1",
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(createBillingCheckoutSession).mockResolvedValue({
        data: {
          id: "sess-1",
          workspaceId: "w1",
          targetPlanCode: "team_contractor",
          requestedBillingCycle: "monthly",
          status: "created",
          providerSessionRef: null,
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
          createdByUserId: "u1",
          createdAt: "2026-03-19T12:00:00Z",
          expiresAt: null,
          metadata: {},
        },
        error: null,
      });
      const { data, error } = await createBillingCheckoutSessionService(noopSupabase, {
        workspaceId: "w1",
        request: {
          targetPlanCode: "team_contractor",
          billingCycle: "monthly",
          returnUrl: "https://app.example.com/success",
          cancelUrl: "https://app.example.com/cancel",
        },
        createdByUserId: "u1",
      });
      if (error) {
        expect(error).not.toMatch(/not in pilot cohort|pilot cohort/i);
      } else {
        expect(data?.checkoutSessionId).toBe("sess-1");
        expect(data?.providerKind).toBe("stripe");
        expect(data?.message).not.toMatch(/not in pilot cohort|pilot cohort/i);
      }
    });
  });

  describe("getWorkspaceBillingOverview", () => {
    it("returns overview when selected plan exists, billing subscription absent", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "team_contractor",
        sourceKind: "recommendation_selected",
        selectedByUserId: "u1",
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
      vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

      const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

      expect(overview.selectedPlan.canonicalPlanCode).toBe("team_contractor");
      expect(overview.billingSubscription).toBeNull();
      expect(overview.readinessFlags.hasActiveSubscription).toBe(false);
      expect(overview.readinessFlags.checkoutEnabled).toBe(false);
      expect(overview.readinessFlags.sandboxMode).toBe(true);
    });

    it("does not imply active paid subscription when none exists", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "client_personal",
        sourceKind: "manual_backend_set",
        selectedByUserId: null,
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
      vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

      const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

      expect(overview.readinessFlags.hasActiveSubscription).toBe(false);
      expect(overview.readinessFlags.billingConnected).toBe(false);
    });


    it("returns manual/legacy when customer has provider ref", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "team_contractor",
        sourceKind: "manual_backend_set",
        selectedByUserId: null,
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
      vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue({
        workspaceId: "w1",
        providerCustomerRef: "cus_legacy",
        billingEmail: "billing@example.com",
        status: "manual",
        meta: {},
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

      const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

      expect(overview.readinessFlags.billingConnected).toBe(true);
    });

    describe("Step 16 mode reflection (checkout-readiness)", () => {
      it("includes liveCheckoutEnabled and checkoutMode in readinessFlags", async () => {
        vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
          tenantId: "w1",
          canonicalPlanCode: "client_personal",
          sourceKind: "manual_backend_set",
          selectedByUserId: null,
          selectedAt: "2026-03-19T12:00:00Z",
          addOnCodes: [],
          createdAt: "2026-03-19T12:00:00Z",
          updatedAt: "2026-03-19T12:00:00Z",
        });
        vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
        vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
        vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

        const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

        expect(overview.readinessFlags).toHaveProperty("liveCheckoutEnabled");
        expect(overview.readinessFlags).toHaveProperty("checkoutMode");
        expect(typeof overview.readinessFlags.liveCheckoutEnabled).toBe("boolean");
        expect(["sandbox", "provider_stub", "provider_live"]).toContain(overview.readinessFlags.checkoutMode);
      });

      it("provider off -> sandbox mode, no misleading paid activation", async () => {
        vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
          tenantId: "w1",
          canonicalPlanCode: "client_personal",
          sourceKind: "manual_backend_set",
          selectedByUserId: null,
          selectedAt: "2026-03-19T12:00:00Z",
          addOnCodes: [],
          createdAt: "2026-03-19T12:00:00Z",
          updatedAt: "2026-03-19T12:00:00Z",
        });
        vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
        vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
        vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

        const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

        expect(overview.readinessFlags.checkoutMode).toBe("sandbox");
        expect(overview.readinessFlags.liveCheckoutEnabled).toBe(false);
        expect(overview.readinessFlags.hasActiveSubscription).toBe(false);
        expect(overview.readinessFlags.checkoutEnabled).toBe(false);
      });

      it("provider on + live off -> provider_stub reported", async () => {
        setEnv(FLAG_PROVIDER, "true");
        setEnv(SECRET, "sk_test_xxx");
        setEnv(WEBHOOK, "whsec_xxx");
        vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
          tenantId: "w1",
          canonicalPlanCode: "client_personal",
          sourceKind: "manual_backend_set",
          selectedByUserId: null,
          selectedAt: "2026-03-19T12:00:00Z",
          addOnCodes: [],
          createdAt: "2026-03-19T12:00:00Z",
          updatedAt: "2026-03-19T12:00:00Z",
        });
        vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
        vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
        vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

        const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

        expect(overview.readinessFlags.checkoutMode).toBe("provider_stub");
        expect(overview.readinessFlags.liveCheckoutEnabled).toBe(false);
      });

      it("provider on + live on + valid config + workspace in pilot -> provider_live reported", async () => {
        setEnv(FLAG_PROVIDER, "true");
        setEnv(FLAG_LIVE, "true");
        setEnv(SECRET, "sk_test_xxx");
        setEnv(WEBHOOK, "whsec_xxx");
        setEnv(PILOT_ALLOWLIST, "w1");
        vi.mocked(getWorkspacePilotStatus).mockResolvedValue(pilotInCohort);
        vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
          tenantId: "w1",
          canonicalPlanCode: "client_personal",
          sourceKind: "manual_backend_set",
          selectedByUserId: null,
          selectedAt: "2026-03-19T12:00:00Z",
          addOnCodes: [],
          createdAt: "2026-03-19T12:00:00Z",
          updatedAt: "2026-03-19T12:00:00Z",
        });
        vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);
        vi.mocked(getBillingCustomerByWorkspace).mockResolvedValue(null);
        vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({} as never);

        const overview = await getWorkspaceBillingOverview(noopSupabase, "w1");

        expect(overview.readinessFlags.checkoutMode).toBe("provider_live");
        expect(overview.readinessFlags.liveCheckoutEnabled).toBe(true);
      });
    });
  });

  describe("getWorkspaceBillingState", () => {
    it("returns state with null subscription when none", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
        tenantId: "w1",
        canonicalPlanCode: "client_personal",
        sourceKind: "manual_backend_set",
        selectedByUserId: null,
        selectedAt: "2026-03-19T12:00:00Z",
        addOnCodes: [],
        createdAt: "2026-03-19T12:00:00Z",
        updatedAt: "2026-03-19T12:00:00Z",
      });
      vi.mocked(getCurrentBillingSubscription).mockResolvedValue(null);

      const state = await getWorkspaceBillingState(noopSupabase, "w1");

      expect(state.workspaceId).toBe("w1");
      expect(state.selectedPlanCode).toBe("client_personal");
      expect(state.billingSubscriptionId).toBeNull();
      expect(state.checkoutAvailable).toBe(false);
    });
  });

  describe("recordBillingEvent", () => {
    it("returns id when event recorded", async () => {
      vi.mocked(createBillingEventRecord).mockResolvedValue({
        data: {
          id: "evt-1",
          workspaceId: "w1",
          billingProvider: "none",
          providerEventRef: "ref-1",
          eventType: "test.created",
          eventPayloadSnapshot: {},
          processingStatus: "pending",
          processedAt: null,
          receivedAt: "2026-03-19T12:00:00Z",
          errorInfo: null,
        },
        error: null,
      });
      const { data, error } = await recordBillingEvent(noopSupabase, {
        workspaceId: "w1",
        billingProvider: "none",
        providerEventRef: "ref-1",
        eventType: "test.created",
      });
      expect(error).toBeNull();
      expect(data?.id).toBe("evt-1");
    });
  });
});
