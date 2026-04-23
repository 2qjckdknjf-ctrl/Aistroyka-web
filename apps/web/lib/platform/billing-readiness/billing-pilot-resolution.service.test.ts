import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveBillingPilotEligibility,
  getBillingPilotDiagnostics,
  resolveLiveBillingModeForWorkspace,
} from "./billing-pilot-resolution.service";

vi.mock("./billing-provider-config", () => ({
  getBillingProviderRuntimeConfig: vi.fn(),
  getStripeWebhookIngressConfig: vi.fn(),
}));
vi.mock("./billing-pilot.repository", () => ({
  getWorkspacePilotStatus: vi.fn(),
}));

const { getBillingProviderRuntimeConfig } = await import("./billing-provider-config");
const { getStripeWebhookIngressConfig } = await import("./billing-provider-config");
const { getWorkspacePilotStatus } = await import("./billing-pilot.repository");

const noopSupabase = {} as SupabaseClient;

function defaultRuntime() {
  return {
    flagEnabled: true,
    providerKind: "stripe" as const,
    configValid: true,
    liveCheckoutEnabled: true,
    fallbackReason: null,
    stripeConfig: { secretKey: "sk_test_xxx", webhookSecret: "whsec_xxx" },
    webhookIngressEnabled: true,
  };
}
function defaultWebhook() {
  return { enabled: true, webhookSecretValid: true };
}
function defaultPilot() {
  return {
    inCohort: true,
    liveCheckoutEnabled: true,
    webhookProcessingEnabled: true,
    source: "env" as const,
  };
}

describe("billing-pilot-resolution.service (Step 18)", () => {
  beforeEach(() => {
    vi.mocked(getBillingProviderRuntimeConfig).mockReturnValue(defaultRuntime());
    vi.mocked(getStripeWebhookIngressConfig).mockReturnValue(defaultWebhook());
    vi.mocked(getWorkspacePilotStatus).mockResolvedValue(defaultPilot());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveBillingPilotEligibility", () => {
    it("returns sandbox when workspace missing", async () => {
      vi.mocked(getWorkspacePilotStatus).mockResolvedValue({ ...defaultPilot(), inCohort: false });
      const result = await resolveBillingPilotEligibility(noopSupabase, "");
      expect(result.liveCheckoutEligible).toBe(false);
      expect(result.webhookProcessingEligible).toBe(false);
      expect(result.reason).toBe("missing_workspace");
      expect(result.mode).toBe("sandbox");
    });

    it("returns sandbox when feature flag disabled", async () => {
      vi.mocked(getBillingProviderRuntimeConfig).mockReturnValue({
        ...defaultRuntime(),
        flagEnabled: false,
        configValid: false,
      });
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(false);
      expect(result.reason).toBe("feature_flag_disabled");
      expect(result.mode).toBe("sandbox");
    });

    it("returns sandbox when config invalid", async () => {
      vi.mocked(getBillingProviderRuntimeConfig).mockReturnValue({
        ...defaultRuntime(),
        configValid: false,
      });
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(false);
      expect(result.reason).toBe("provider_config_invalid");
      expect(result.mode).toBe("sandbox");
    });

    it("returns provider_stub when workspace not allowlisted", async () => {
      vi.mocked(getWorkspacePilotStatus).mockResolvedValue({
        inCohort: false,
        liveCheckoutEnabled: false,
        webhookProcessingEnabled: false,
        source: "none",
      });
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(false);
      expect(result.webhookProcessingEligible).toBe(false);
      expect(result.reason).toBe("workspace_not_allowlisted");
      expect(result.inPilotCohort).toBe(false);
      expect(result.mode).toBe("provider_stub");
    });

    it("returns provider_stub when live checkout disabled", async () => {
      vi.mocked(getBillingProviderRuntimeConfig).mockReturnValue({
        ...defaultRuntime(),
        liveCheckoutEnabled: false,
      });
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(false);
      expect(result.reason).toBe("live_checkout_disabled");
      expect(result.inPilotCohort).toBe(true);
      expect(result.mode).toBe("provider_stub");
    });

    it("returns provider_live when workspace allowlisted and all flags valid", async () => {
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(true);
      expect(result.webhookProcessingEligible).toBe(true);
      expect(result.reason).toBe("pilot_cohort_eligible");
      expect(result.inPilotCohort).toBe(true);
      expect(result.mode).toBe("provider_live");
    });

    it("webhookProcessingEligible false when webhook ingress disabled", async () => {
      vi.mocked(getStripeWebhookIngressConfig).mockReturnValue({
        enabled: false,
        webhookSecretValid: false,
      });
      const result = await resolveBillingPilotEligibility(noopSupabase, "w1");
      expect(result.liveCheckoutEligible).toBe(true);
      expect(result.webhookProcessingEligible).toBe(false);
    });
  });

  describe("resolveLiveBillingModeForWorkspace", () => {
    it("returns provider_live when eligible", async () => {
      const mode = await resolveLiveBillingModeForWorkspace(noopSupabase, "w1");
      expect(mode).toBe("provider_live");
    });
    it("returns provider_stub when not in cohort", async () => {
      vi.mocked(getWorkspacePilotStatus).mockResolvedValue({
        inCohort: false,
        liveCheckoutEnabled: false,
        webhookProcessingEnabled: false,
        source: "none",
      });
      const mode = await resolveLiveBillingModeForWorkspace(noopSupabase, "w1");
      expect(mode).toBe("provider_stub");
    });
  });

  describe("getBillingPilotDiagnostics", () => {
    it("returns full diagnostics with reason", async () => {
      const diag = await getBillingPilotDiagnostics(noopSupabase, "w1");
      expect(diag.workspaceId).toBe("w1");
      expect(diag.inPilotCohort).toBe(true);
      expect(diag.liveCheckoutEligible).toBe(true);
      expect(diag.webhookProcessingEligible).toBe(true);
      expect(diag.mode).toBe("provider_live");
      expect(diag.globalProviderEnabled).toBe(true);
      expect(diag.configValid).toBe(true);
    });
  });
});
