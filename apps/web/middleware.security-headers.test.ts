import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

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

import {
  getApiSecurityHeaders,
  getPageSecurityHeaders,
  buildCspValue,
} from "@/lib/security-headers";
import { middleware } from "./middleware";

function expectApiSecurityHeaders(res: Response): void {
  for (const { key, value } of getApiSecurityHeaders()) {
    expect(res.headers.get(key), `missing or wrong ${key}`).toBe(value);
  }
  expect(res.headers.get("Content-Security-Policy")).toBeNull();
  // Headers whose canonical values have no commas must not be duplicated via join.
  expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
}

function expectPageSecurityHeaders(res: Response): void {
  const expected = getPageSecurityHeaders(process.env.NODE_ENV === "development");
  for (const { key, value } of expected) {
    expect(res.headers.get(key), `missing or wrong ${key}`).toBe(value);
  }
  expect(res.headers.get("Content-Security-Policy")).toBe(
    buildCspValue(process.env.NODE_ENV === "development")
  );
  expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
}

describe("middleware API security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
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

describe("middleware page security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
  });

  it("applies page security headers on public localized page with CSP", async () => {
    const req = new NextRequest("https://aistroyka.ai/en");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expectPageSecurityHeaders(res);
  });

  it("applies page security headers on login page with CSP", async () => {
    const req = new NextRequest("https://aistroyka.ai/en/login");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expectPageSecurityHeaders(res);
  });

  it("applies page security headers on unauthenticated protected dashboard redirect", async () => {
    const req = new NextRequest("https://aistroyka.ai/en/dashboard");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("Location")).toContain("/en/login");
    expect(res.headers.get("X-Auth-Redirect")).toBe("login");
    expectPageSecurityHeaders(res);
  });
});
