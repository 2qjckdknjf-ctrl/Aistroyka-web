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
const mockSaveAuditRunSnapshot = vi.fn();
const mockInsertPlatformOwnerAudit = vi.fn();
const mockGetSessionUser = vi.fn();
vi.mock("@/lib/platform-admin/roma-run-history.service", () => ({ saveAuditRunSnapshot: (...a: unknown[]) => mockSaveAuditRunSnapshot(...a) }));
vi.mock("@/lib/platform-owner/owner-audit.service", () => ({ insertPlatformOwnerAudit: (...a: unknown[]) => mockInsertPlatformOwnerAudit(...a) }));
vi.mock("@/lib/supabase/server", () => ({ getSessionUser: (...a: unknown[]) => mockGetSessionUser(...a) }));
vi.mock("@/lib/platform-owner/client-ip", () => ({ getRequestClientIp: () => "127.0.0.1" }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { POST } from "./route";

describe("app/api/v1/platform/testing/safe-audit/save/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({}); mockGetSessionUser.mockResolvedValue({ id: 'u1', email: 'o@x.com' }); mockSaveAuditRunSnapshot.mockResolvedValue({ runId: 'r1', status: 'ok', releaseRecommendation: 'GO', environment: 'test' }); mockInsertPlatformOwnerAudit.mockResolvedValue(undefined);
  });

  describe("POST /api/v1/platform/testing/safe-audit/save", () => {
    it("calls requirePlatformOwnerApi first with mode write", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/save", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockSaveAuditRunSnapshot).not.toHaveBeenCalled();
      expect(mockInsertPlatformOwnerAudit).not.toHaveBeenCalled();
      expect(mockGetSessionUser).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/save", "POST"));
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockSaveAuditRunSnapshot).not.toHaveBeenCalled();
      expect(mockInsertPlatformOwnerAudit).not.toHaveBeenCalled();
      expect(mockGetSessionUser).not.toHaveBeenCalled();
    });

    it("OWNER_READONLY denied path leaves business deps uncalled when guard denies", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) });
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/save", "POST"));
      expect(res.status).toBe(403);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockSaveAuditRunSnapshot).not.toHaveBeenCalled();
      expect(mockInsertPlatformOwnerAudit).not.toHaveBeenCalled();
      expect(mockGetSessionUser).not.toHaveBeenCalled();
    });

    it.each(["OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await POST(requestFor("/api/v1/platform/testing/safe-audit/save", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
