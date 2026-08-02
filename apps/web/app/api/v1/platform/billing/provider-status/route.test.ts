import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATFORM_NEGATIVE_IDENTITIES,
  expectForbiddenOwnerGate,
  ownerDenyForIdentity,
  ownerOk,
  requestFor,
} from "@/tests/helpers/platform-owner-route-assertions";

const mockRequirePlatformOwnerApi = vi.fn();
const mockGetBillingAdapterDiagnostics = vi.fn();
const mockGetStripePriceMappingDiagnostics = vi.fn();
const mockGetStripeWebhookIngressConfig = vi.fn();
vi.mock("@/lib/platform/billing-readiness/billing-adapter-registry", () => ({ getBillingAdapterDiagnostics: (...a: unknown[]) => mockGetBillingAdapterDiagnostics(...a) }));
vi.mock("@/lib/platform/billing-readiness/stripe-price-mapping", () => ({ getStripePriceMappingDiagnostics: (...a: unknown[]) => mockGetStripePriceMappingDiagnostics(...a) }));
vi.mock("@/lib/platform/billing-readiness/billing-provider-config", () => ({ getStripeWebhookIngressConfig: (...a: unknown[]) => mockGetStripeWebhookIngressConfig(...a) }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { GET } from "./route";

describe("app/api/v1/platform/billing/provider-status/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetBillingAdapterDiagnostics.mockReturnValue({}); mockGetStripePriceMappingDiagnostics.mockReturnValue({}); mockGetStripeWebhookIngressConfig.mockReturnValue({});
  });

  describe("GET /api/v1/platform/billing/provider-status", () => {
    it("calls requirePlatformOwnerApi first with mode read", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await GET(requestFor("/api/v1/platform/billing/provider-status", "GET"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetBillingAdapterDiagnostics).not.toHaveBeenCalled();
      expect(mockGetStripePriceMappingDiagnostics).not.toHaveBeenCalled();
      expect(mockGetStripeWebhookIngressConfig).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await GET(requestFor("/api/v1/platform/billing/provider-status", "GET"));
      await expectForbiddenOwnerGate(res);
      expect(mockGetBillingAdapterDiagnostics).not.toHaveBeenCalled();
      expect(mockGetStripePriceMappingDiagnostics).not.toHaveBeenCalled();
      expect(mockGetStripeWebhookIngressConfig).not.toHaveBeenCalled();
    });

    it.each(["OWNER_READONLY", "OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await GET(requestFor("/api/v1/platform/billing/provider-status", "GET"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
