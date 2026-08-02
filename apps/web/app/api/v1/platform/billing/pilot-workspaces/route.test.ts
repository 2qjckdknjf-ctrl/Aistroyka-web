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
const mockListBillingPilotWorkspacesSummary = vi.fn();
const mockAddWorkspaceToPilotCohort = vi.fn();
vi.mock("@/lib/platform/billing-readiness/billing-pilot-ops.service", () => ({ listBillingPilotWorkspacesSummary: (...a: unknown[]) => mockListBillingPilotWorkspacesSummary(...a), addWorkspaceToPilotCohort: (...a: unknown[]) => mockAddWorkspaceToPilotCohort(...a) }));
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { GET, POST } from "./route";

describe("app/api/v1/platform/billing/pilot-workspaces/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({}); mockListBillingPilotWorkspacesSummary.mockResolvedValue([]); mockAddWorkspaceToPilotCohort.mockResolvedValue({ data: { id: '11111111-1111-4111-8111-111111111111' }, error: null });
  });

  describe("GET /api/v1/platform/billing/pilot-workspaces", () => {
    it("calls requirePlatformOwnerApi first with mode read", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await GET(requestFor("/api/v1/platform/billing/pilot-workspaces", "GET"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
      expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await GET(requestFor("/api/v1/platform/billing/pilot-workspaces", "GET"));
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
      expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
    });

    it.each(["OWNER_READONLY", "OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await GET(requestFor("/api/v1/platform/billing/pilot-workspaces", "GET"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("POST /api/v1/platform/billing/pilot-workspaces", () => {
    it("calls requirePlatformOwnerApi first with mode write", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await POST(requestFor("/api/v1/platform/billing/pilot-workspaces", "POST", { body: {"workspaceId":"11111111-1111-4111-8111-111111111111"} }));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
      expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await POST(requestFor("/api/v1/platform/billing/pilot-workspaces", "POST", { body: {"workspaceId":"11111111-1111-4111-8111-111111111111"} }));
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
      expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
    });

    it("OWNER_READONLY denied path leaves business deps uncalled when guard denies", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) });
      const res = await POST(requestFor("/api/v1/platform/billing/pilot-workspaces", "POST", { body: {"workspaceId":"11111111-1111-4111-8111-111111111111"} }));
      expect(res.status).toBe(403);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
      expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
      expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
    });

    it.each(["OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await POST(requestFor("/api/v1/platform/billing/pilot-workspaces", "POST", { body: {"workspaceId":"11111111-1111-4111-8111-111111111111"} }));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
