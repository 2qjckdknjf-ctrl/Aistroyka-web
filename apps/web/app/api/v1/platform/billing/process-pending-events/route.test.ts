import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATFORM_NEGATIVE_IDENTITIES,
  expectForbiddenOwnerGate,
  ownerDenyForIdentity,
  ownerOk,
  requestFor,
} from "@/tests/helpers/platform-owner-route-assertions";

const mockRequirePlatformOwnerApi = vi.fn();
const mockGetAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: (...a: unknown[]) => mockGetAdminClient(...a) }));
const mockProcessPendingBillingEvents = vi.fn();
vi.mock("@/lib/platform/billing-readiness/billing-event-processor.service", () => ({ processPendingBillingEvents: (...a: unknown[]) => mockProcessPendingBillingEvents(...a) }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { POST } from "./route";

describe("app/api/v1/platform/billing/process-pending-events/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({});
    mockProcessPendingBillingEvents.mockResolvedValue([]);
  });

  describe("POST /api/v1/platform/billing/process-pending-events", () => {
    it("calls requirePlatformOwnerApi first with mode write", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await POST(requestFor("/api/v1/platform/billing/process-pending-events", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockProcessPendingBillingEvents).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await POST(requestFor("/api/v1/platform/billing/process-pending-events", "POST"));
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockProcessPendingBillingEvents).not.toHaveBeenCalled();
    });

    it("OWNER_READONLY denied path leaves business deps uncalled when guard denies", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) });
      const res = await POST(requestFor("/api/v1/platform/billing/process-pending-events", "POST"));
      expect(res.status).toBe(403);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockProcessPendingBillingEvents).not.toHaveBeenCalled();
    });

    it.each(["OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await POST(requestFor("/api/v1/platform/billing/process-pending-events", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
