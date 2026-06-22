import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockUpdateSession,
  mockGateOwnerRequest,
  mockCheckLiteAllowList,
  mockIntlMiddleware,
} = vi.hoisted(() => ({
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

import { REQUIRED_API_SECURITY_HEADER_KEYS } from "@/lib/security-headers";
import { middleware } from "./middleware";

function expectApiSecurityHeaders(res: Response): void {
  for (const key of REQUIRED_API_SECURITY_HEADER_KEYS) {
    expect(res.headers.get(key), `missing ${key}`).toBeTruthy();
  }
  expect(res.headers.get("Content-Security-Policy")).toBeNull();
}

describe("middleware API security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockUpdateSession.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      user: null,
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("applies API headers on /api/v1 pass-through without CSP", async () => {
    const req = new NextRequest("https://aistroyka.ai/api/v1/health");
    const res = await middleware(req);
    expectApiSecurityHeaders(res);
  });

  it("applies API headers on lite allow-list 403 without CSP", async () => {
    mockCheckLiteAllowList.mockReturnValueOnce({ body: { error: "forbidden" } });
    const req = new NextRequest("https://aistroyka.ai/api/v1/projects/p1/tasks", {
      headers: { "x-client": "ios_lite" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(403);
    expectApiSecurityHeaders(res);
  });

  it("applies API headers on owner API deny without CSP", async () => {
    mockGateOwnerRequest.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "forbidden" }), { status: 403 })
    );
    const req = new NextRequest("https://aistroyka.ai/api/v1/owner/tenants");
    const res = await middleware(req);
    expect(res.status).toBe(403);
    expectApiSecurityHeaders(res);
  });
});
