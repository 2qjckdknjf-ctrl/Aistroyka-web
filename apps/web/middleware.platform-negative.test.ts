/**
 * Phase 2B.4 — middleware proofs for all 29 canonical platform method/path combinations.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";
import {
  concretePlatformPath,
  PHASE2B4_PLATFORM_METHODS,
} from "@/lib/platform-owner/phase2b4-platform-inventory";

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

const PLATFORM_METHODS = PHASE2B4_PLATFORM_METHODS.map((row) => ({
  path: concretePlatformPath(row.routePath),
  method: row.method,
  routePath: row.routePath,
}));

describe("middleware Phase 2B.4 platform negative gate", () => {
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

  it("inventory covers exactly 29 methods", () => {
    expect(PLATFORM_METHODS).toHaveLength(29);
  });

  it.each(PLATFORM_METHODS)(
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
      const callReq = mockGateOwnerRequest.mock.calls[0][0].request as NextRequest;
      expect(callReq.method).toBe(method);
    }
  );

  it.each(PLATFORM_METHODS)(
    "denies $method $path when gateOwnerRequest returns 403 and stops execution",
    async ({ path, method }) => {
      mockGateOwnerRequest.mockResolvedValueOnce(
        NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 })
      );
      const req = new NextRequest(`https://aistroyka.ai${path}`, { method });
      const res = await middleware(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe("owner_gate");
      expect(res.headers.get(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER)).toBeNull();
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    }
  );

  it.each(PLATFORM_METHODS)(
    "allows $method $path preserving session cookies, security headers, rate-limit marker",
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

  it("does not classify near-match /api/v1/platformish as platform owner API", async () => {
    for (const path of ["/api/v1/platformish", "/api/v1/platformish/overview"]) {
      mockGateOwnerRequest.mockClear();
      const req = new NextRequest(`https://aistroyka.ai${path}`, { method: "GET" });
      await middleware(req);
      expect(mockGateOwnerRequest).not.toHaveBeenCalled();
    }
  });
});
