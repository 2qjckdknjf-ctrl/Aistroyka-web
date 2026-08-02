import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATFORM_NEGATIVE_IDENTITIES,
  expectForbiddenOwnerGate,
  ownerDenyForIdentity,
  ownerOk,
  requestFor,
} from "@/tests/helpers/platform-owner-route-assertions";

const mockRequirePlatformOwnerApi = vi.fn();
const mockBuildSafeReadonlyAuditRefreshResponse = vi.fn();
vi.mock("@/lib/platform-admin/roma-safe-readonly-audit", () => ({ buildSafeReadonlyAuditRefreshResponse: (...a: unknown[]) => mockBuildSafeReadonlyAuditRefreshResponse(...a) }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { POST } from "./route";

describe("app/api/v1/platform/testing/safe-audit/refresh/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockBuildSafeReadonlyAuditRefreshResponse.mockResolvedValue({ mode: 'SAFE_READONLY_AUDIT' });
  });

  describe("POST /api/v1/platform/testing/safe-audit/refresh", () => {
    it("calls requirePlatformOwnerApi first with mode read", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/refresh", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      await expectForbiddenOwnerGate(res);
      expect(mockBuildSafeReadonlyAuditRefreshResponse).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/refresh", "POST"));
      await expectForbiddenOwnerGate(res);
      expect(mockBuildSafeReadonlyAuditRefreshResponse).not.toHaveBeenCalled();
    });

    it.each(["OWNER_READONLY", "OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/refresh", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });

    it("OWNER_READONLY reaches refresh builder (no persistence/CI)", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk("OWNER_READONLY"));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/refresh", "POST"));
      expect(res.status).toBe(200);
      expect(mockBuildSafeReadonlyAuditRefreshResponse).toHaveBeenCalledTimes(1);
    });
  });

});
