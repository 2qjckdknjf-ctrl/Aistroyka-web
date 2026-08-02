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
const mockRemoveWorkspaceFromPilotCohort = vi.fn();
vi.mock("@/lib/platform/billing-readiness/billing-pilot-ops.service", () => ({ removeWorkspaceFromPilotCohort: (...a: unknown[]) => mockRemoveWorkspaceFromPilotCohort(...a) }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { DELETE } from "./route";

describe("app/api/v1/platform/billing/pilot-workspaces/[workspaceId]/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({}); mockRemoveWorkspaceFromPilotCohort.mockResolvedValue({ ok: true });
  });

  describe("DELETE /api/v1/platform/billing/pilot-workspaces/ws-1", () => {
    it("calls requirePlatformOwnerApi first with mode write", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await DELETE(requestFor("/api/v1/platform/billing/pilot-workspaces/ws-1", "DELETE"), { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockRemoveWorkspaceFromPilotCohort).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await DELETE(requestFor("/api/v1/platform/billing/pilot-workspaces/ws-1", "DELETE"), { params: Promise.resolve({ workspaceId: "ws-1" }) });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockRemoveWorkspaceFromPilotCohort).not.toHaveBeenCalled();
    });

    it("OWNER_READONLY denied path leaves business deps uncalled when guard denies", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) });
      const res = await DELETE(requestFor("/api/v1/platform/billing/pilot-workspaces/ws-1", "DELETE"), { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(res.status).toBe(403);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockRemoveWorkspaceFromPilotCohort).not.toHaveBeenCalled();
    });

    it.each(["OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await DELETE(requestFor("/api/v1/platform/billing/pilot-workspaces/ws-1", "DELETE"), { params: Promise.resolve({ workspaceId: "ws-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
