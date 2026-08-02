import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLATFORM_NEGATIVE_IDENTITIES,
  expectForbiddenOwnerGate,
  ownerDenyForIdentity,
  ownerOk,
  requestFor,
} from "@/tests/helpers/platform-owner-route-assertions";

const mockRequirePlatformOwnerApi = vi.fn();
vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({ requirePlatformOwnerApi: (...a: unknown[]) => mockRequirePlatformOwnerApi(...a) }));

import { POST } from "./route";

describe("app/api/v1/platform/critical/echo/route.test.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    
  });

  describe("POST /api/v1/platform/critical/echo", () => {
    it("calls requirePlatformOwnerApi first with mode critical", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity("anonymous"));
      const res = await POST(requestFor("/api/v1/platform/critical/echo", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "critical" });
      await expectForbiddenOwnerGate(res);
    });

    it.each(PLATFORM_NEGATIVE_IDENTITIES)("denies %s without side effects", async (identity) => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDenyForIdentity(identity));
      const res = await POST(requestFor("/api/v1/platform/critical/echo", "POST"));
      await expectForbiddenOwnerGate(res);
    });

    it("OWNER without step-up denial leaves handler body unexecuted", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce({ ok: false as const, response: (await import("next/server")).NextResponse.json({ error: "forbidden", code: "owner_step_up_required" }, { status: 403 }) });
      const res = await POST(requestFor("/api/v1/platform/critical/echo", "POST"));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("owner_step_up_required");
    });

    it("allows OWNER success branch when guard returns ok", async () => {
      mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerOk("OWNER"));
      const res = await POST(requestFor("/api/v1/platform/critical/echo", "POST"));
      expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "critical" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.echo).toBe("critical_ack");
    });
  });

});
