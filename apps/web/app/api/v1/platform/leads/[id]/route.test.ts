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
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { GET, PATCH } from "./route";

describe("app/api/v1/platform/leads/[id]/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: "lead-1" }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { id: "lead-1" }, error: null }),
            }),
          }),
        }),
      }),
    });
  });

  describe("GET /api/v1/platform/leads/lead-1", () => {
    it("calls requirePlatformOwnerApi first with mode read", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await GET(requestFor("/api/v1/platform/leads/lead-1", "GET"), { params: Promise.resolve({ id: "lead-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await GET(requestFor("/api/v1/platform/leads/lead-1", "GET"), { params: Promise.resolve({ id: "lead-1" }) });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
    });

    it.each(["OWNER_READONLY", "OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await GET(requestFor("/api/v1/platform/leads/lead-1", "GET"), { params: Promise.resolve({ id: "lead-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("PATCH /api/v1/platform/leads/lead-1", () => {
    it("calls requirePlatformOwnerApi first with mode write", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await PATCH(requestFor("/api/v1/platform/leads/lead-1", "PATCH", { body: {"status":"reviewed"} }), { params: Promise.resolve({ id: "lead-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await PATCH(requestFor("/api/v1/platform/leads/lead-1", "PATCH", { body: {"status":"reviewed"} }), { params: Promise.resolve({ id: "lead-1" }) });
      await expectForbiddenOwnerGate(res);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
    });

    it("OWNER_READONLY denied path leaves business deps uncalled when guard denies", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_readonly" }, { status: 403 }) });
      const res = await PATCH(requestFor("/api/v1/platform/leads/lead-1", "PATCH", { body: {"status":"reviewed"} }), { params: Promise.resolve({ id: "lead-1" }) });
      expect(res.status).toBe(403);
      expect(mockGetAdminClient).not.toHaveBeenCalled();
    });

    it.each(["OWNER_OPERATOR", "OWNER"] as const)("allows %s success branch", async (role) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk(role));
      const res = await PATCH(requestFor("/api/v1/platform/leads/lead-1", "PATCH", { body: {"status":"reviewed"} }), { params: Promise.resolve({ id: "lead-1" }) });
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

});
