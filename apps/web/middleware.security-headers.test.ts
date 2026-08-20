import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const {
  mockUpdateSession,
  mockGateOwnerRequest,
  mockCheckLiteAllowList,
  mockIntlMiddleware,
  mockGetActiveTenantRoleForUser,
} = vi.hoisted(() => ({
  mockUpdateSession: vi.fn(),
  mockGateOwnerRequest: vi.fn(),
  mockCheckLiteAllowList: vi.fn(),
  mockIntlMiddleware: vi.fn(),
  mockGetActiveTenantRoleForUser: vi.fn(),
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

vi.mock("@/lib/tenant/tenant-role.server", () => ({
  getActiveTenantRoleForUser: (...args: unknown[]) => mockGetActiveTenantRoleForUser(...args),
}));

import {
  REQUIRED_API_SECURITY_HEADER_KEYS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
} from "@/lib/security-headers";
import { middleware } from "./middleware";

const PAGE_SINGLETON_HEADERS = [
  ...REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  "Strict-Transport-Security",
] as const;

function expectApiSecurityHeaders(res: Response): void {
  for (const key of REQUIRED_API_SECURITY_HEADER_KEYS) {
    expect(res.headers.get(key), `missing ${key}`).toBeTruthy();
    const value = res.headers.get(key)!;
    if (key === "Permissions-Policy") {
      expect(value.toLowerCase().split("camera=").length - 1).toBe(1);
    } else {
      expect(value, `joined duplicate for ${key}`).not.toMatch(/,/);
    }
  }
  expect(res.headers.get("Content-Security-Policy")).toBeNull();
}

function expectNoPageSecurityHeadersFromMiddleware(res: Response): void {
  for (const key of PAGE_SINGLETON_HEADERS) {
    expect(res.headers.get(key), `middleware must not set page header ${key}`).toBeNull();
  }
}

describe("middleware API security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockGetActiveTenantRoleForUser.mockResolvedValue(null);
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
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBeTruthy();
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

describe("middleware does not own page security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockGetActiveTenantRoleForUser.mockResolvedValue(null);
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
  });

  it("source does not import or apply page security header helpers", () => {
    const src = readFileSync(join(__dirname, "middleware.ts"), "utf8");
    expect(src).not.toMatch(/getPageSecurityHeaders/);
    expect(src).not.toMatch(/applyPageSecurityHeaders/);
    expect(src).not.toMatch(/applySecurityHeadersToResponse/);
    expect(src).not.toMatch(/Content-Security-Policy/);
    expect(src).not.toMatch(/Strict-Transport-Security/);
    expect(src).toMatch(/applyApiSecurityHeadersToHeaders/);
    expect(src).toMatch(/next\.config\.js/);
  });

  it("public localized page keeps host/auth headers without page security set", async () => {
    const req = new NextRequest("https://aistroyka.ai/en");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expectNoPageSecurityHeadersFromMiddleware(res);
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBeTruthy();
    expect(res.headers.get("X-Auth-Redirect")).toBe("pass");
  });

  it("login page keeps cache-control and host profile without page security set", async () => {
    const req = new NextRequest("https://aistroyka.ai/en/login");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expectNoPageSecurityHeadersFromMiddleware(res);
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toMatch(/no-store/);
  });

  it("unauthenticated dashboard redirect keeps auth headers without page security set", async () => {
    const req = new NextRequest("https://aistroyka.ai/en/dashboard");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("Location")).toContain("/en/login");
    expect(res.headers.get("X-Auth-Redirect")).toBe("login");
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBeTruthy();
    expectNoPageSecurityHeadersFromMiddleware(res);
  });

  it("preserves Supabase session cookies on protected redirect", async () => {
    const session = NextResponse.next();
    session.cookies.set("sb-access-token", "tok-a", { path: "/" });
    session.cookies.set("sb-refresh-token", "tok-b", { path: "/" });
    mockUpdateSession.mockResolvedValueOnce({
      response: session,
      user: null,
    });
    const req = new NextRequest("https://aistroyka.ai/en/dashboard");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.cookies.get("sb-access-token")?.value).toBe("tok-a");
    expect(res.cookies.get("sb-refresh-token")?.value).toBe("tok-b");
    expectNoPageSecurityHeadersFromMiddleware(res);
  });

  it("redirects portal-only stakeholders off contractor dashboard routes", async () => {
    mockUpdateSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: { id: "stakeholder-1" },
      supabase: {},
    });
    mockGetActiveTenantRoleForUser.mockResolvedValueOnce("stakeholder");
    const req = new NextRequest("https://aistroyka.ai/en/dashboard/tasks");
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("Location")).toBe("https://aistroyka.ai/en/portal/projects");
    expect(res.headers.get("X-Auth-Redirect")).toBe("stakeholder-portal");
    expectNoPageSecurityHeadersFromMiddleware(res);
  });
});
