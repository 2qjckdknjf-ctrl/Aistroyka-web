import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";

const { mockUpdateSession, mockGateOwnerRequest, mockCheckLiteAllowList, mockIntlMiddleware } =
  vi.hoisted(() => ({
    mockUpdateSession: vi.fn(),
    mockGateOwnerRequest: vi.fn(),
    mockCheckLiteAllowList: vi.fn(),
    mockIntlMiddleware: vi.fn(),
  }));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock("@/lib/platform-owner/middleware-owner-gate", () => ({
  gateOwnerRequest: (...args: unknown[]) => mockGateOwnerRequest(...args),
}));

vi.mock("@/lib/api/lite-allow-list", () => ({
  checkLiteAllowList: (...args: unknown[]) => mockCheckLiteAllowList(...args),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => mockIntlMiddleware,
}));

import { middleware } from "./middleware";

const ALIAS_METHODS: Array<{ path: string; method: string }> = [
  { path: "/api/v1/admin/billing/pilot-status", method: "GET" },
  { path: "/api/v1/admin/billing/pilot-workspaces", method: "GET" },
  { path: "/api/v1/admin/billing/pilot-workspaces", method: "POST" },
  { path: "/api/v1/admin/billing/pilot-workspaces/ws-1", method: "DELETE" },
  { path: "/api/v1/admin/billing/process-pending-events", method: "POST" },
  { path: "/api/v1/admin/billing/provider-status", method: "GET" },
  { path: "/api/v1/admin/billing/reprocess-event", method: "POST" },
  { path: "/api/v1/admin/billing/reprocess-workspace-events", method: "POST" },
  { path: "/api/v1/admin/billing/workspace-status", method: "GET" },
  { path: "/api/v1/admin/leads", method: "GET" },
  { path: "/api/v1/admin/leads/lead-1", method: "GET" },
  { path: "/api/v1/admin/leads/lead-1", method: "PATCH" },
  { path: "/api/v1/admin/leads/bulk", method: "PATCH" },
];

describe("middleware platform alias owner gate depth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "owner-1", email: "owner@example.com" },
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
  });

  it.each(ALIAS_METHODS)(
    "calls gateOwnerRequest with exact pathname/method for $method $path",
    async ({ path, method }) => {
      const req = new NextRequest(`https://aistroyka.ai${path}`, { method });
      const res = await middleware(req);
      expect(mockGateOwnerRequest).toHaveBeenCalledTimes(1);
      expect(mockGateOwnerRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: path,
          isApi: true,
          request: expect.objectContaining({ method }),
        })
      );
      expect(res.status).toBe(200);
      // NextRequest headers forwarded to handler include rate-limit marker
      const callReq = mockGateOwnerRequest.mock.calls[0][0].request as NextRequest;
      expect(callReq.method).toBe(method);
    }
  );

  it.each(ALIAS_METHODS)(
    "denies $method $path when gateOwnerRequest returns 403 and does not continue",
    async ({ path, method }) => {
      mockGateOwnerRequest.mockResolvedValueOnce(
        NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 })
      );
      const req = new NextRequest(`https://aistroyka.ai${path}`, { method });
      const res = await middleware(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("owner_gate");
      // Denied responses must not advertise rate-limit-already-applied to the client
      expect(res.headers.get(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER)).toBeNull();
    }
  );

  it.each(ALIAS_METHODS)(
    "allows $method $path and sets owner rate-limit marker on request continuation",
    async ({ path, method }) => {
      const session = NextResponse.next();
      session.cookies.set("sb-access-token", "tok", { path: "/" });
      mockUpdateSession.mockResolvedValueOnce({
        response: session,
        user: { id: "owner-1", email: "owner@example.com" },
      });

      const nextSpy = vi.spyOn(NextResponse, "next");
      try {
        const req = new NextRequest(`https://aistroyka.ai${path}`, { method });
        const res = await middleware(req);
        expect(res.status).toBe(200);
        expect(mockGateOwnerRequest).toHaveBeenCalled();

        const nextCall = nextSpy.mock.calls.find((call) => {
          const init = call[0] as { request?: { headers?: Headers } } | undefined;
          return init?.request?.headers instanceof Headers;
        });
        expect(nextCall).toBeTruthy();
        const forwarded = (nextCall![0] as { request: { headers: Headers } }).request.headers;
        expect(forwarded.get(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER)).toBe("1");

        expect(res.cookies.get("sb-access-token")?.value).toBe("tok");
        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(res.headers.get("X-Aistroyka-Host-Profile")).toBeTruthy();
      } finally {
        nextSpy.mockRestore();
      }
    }
  );

  it("does not owner-gate ordinary admin routes on public host", async () => {
    const req = new NextRequest("https://aistroyka.ai/api/v1/admin/flags", { method: "GET" });
    const res = await middleware(req);
    expect(mockGateOwnerRequest).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("still owner-gates canonical platform and owner APIs", async () => {
    for (const path of ["/api/v1/platform/leads", "/api/v1/owner/tenants"]) {
      mockGateOwnerRequest.mockClear();
      const req = new NextRequest(`https://aistroyka.ai${path}`, { method: "GET" });
      await middleware(req);
      expect(mockGateOwnerRequest).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: path, isApi: true })
      );
    }
  });
});
