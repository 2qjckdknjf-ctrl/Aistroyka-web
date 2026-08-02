/**
 * Phase 2B.6 — middleware wires redirectIfStakeholderBlockedPath for stakeholders.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  mockUpdateSession,
  mockGateOwnerRequest,
  mockCheckLiteAllowList,
  mockIntlMiddleware,
  mockResolveStakeholderPageRedirect,
} = vi.hoisted(() => ({
  mockUpdateSession: vi.fn(),
  mockGateOwnerRequest: vi.fn(),
  mockCheckLiteAllowList: vi.fn(),
  mockIntlMiddleware: vi.fn(),
  mockResolveStakeholderPageRedirect: vi.fn(),
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

vi.mock("@/lib/tenant/stakeholder-middleware-gate", () => ({
  resolveStakeholderPageRedirect: (...args: unknown[]) =>
    mockResolveStakeholderPageRedirect(...args),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => mockIntlMiddleware,
}));

import { middleware } from "./middleware";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BLOCKED_PATHS = [
  { path: "/en/dashboard/tasks", pathWithoutLocale: "/dashboard/tasks", locale: "en" },
  { path: "/ru/dashboard/finance", pathWithoutLocale: "/dashboard/finance", locale: "ru" },
  { path: "/en/billing", pathWithoutLocale: "/billing", locale: "en" },
  { path: "/en/admin", pathWithoutLocale: "/admin", locale: "en" },
  { path: "/en/portal", pathWithoutLocale: "/portal", locale: "en" },
  { path: "/en/projects", pathWithoutLocale: "/projects", locale: "en" },
];

const ALLOWED_PATHS = [
  { path: "/en/dashboard/projects", pathWithoutLocale: "/dashboard/projects", locale: "en" },
  { path: "/en/portal/projects", pathWithoutLocale: "/portal/projects", locale: "en" },
  {
    path: "/en/dashboard/projects/p1/client",
    pathWithoutLocale: "/dashboard/projects/p1/client",
    locale: "en",
  },
];

describe("middleware Phase 2B.6 stakeholder path gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLiteAllowList.mockReturnValue(null);
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "stake-1", email: "stake@example.com" },
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
    mockResolveStakeholderPageRedirect.mockResolvedValue(null);
  });

  it("source wires resolveStakeholderPageRedirect / stakeholder helper", () => {
    const src = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
    expect(src).toMatch(/resolveStakeholderPageRedirect/);
    expect(src).toMatch(/stakeholder-middleware-gate/);
  });

  it.each(BLOCKED_PATHS)(
    "calls stakeholder gate with exact path for $path and redirects when blocked",
    async ({ path, pathWithoutLocale, locale }) => {
      const redir = NextResponse.redirect(
        new URL(`https://aistroyka.ai/${locale}/dashboard/projects`)
      );
      mockResolveStakeholderPageRedirect.mockResolvedValueOnce(redir);

      const req = new NextRequest(`https://aistroyka.ai${path}`);
      const res = await middleware(req);

      expect(mockResolveStakeholderPageRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "stake-1",
          pathWithoutLocale,
          locale,
        })
      );
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.headers.get("X-Auth-Redirect")).toBe("stakeholder-path");
      expect(res.headers.get("location")).toContain("/dashboard/projects");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    }
  );

  it.each(ALLOWED_PATHS)(
    "calls stakeholder gate for $path and continues when allowlisted",
    async ({ path, pathWithoutLocale, locale }) => {
      mockResolveStakeholderPageRedirect.mockResolvedValueOnce(null);
      const req = new NextRequest(`https://aistroyka.ai${path}`);
      const res = await middleware(req);
      expect(mockResolveStakeholderPageRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "stake-1",
          pathWithoutLocale,
          locale,
        })
      );
      expect(res.headers.get("X-Auth-Redirect")).toBe("pass");
      expect(res.status).toBe(200);
    }
  );

  it("does not call stakeholder gate for anonymous users (login redirect first)", async () => {
    mockUpdateSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: null,
    });
    const req = new NextRequest("https://aistroyka.ai/en/dashboard/tasks");
    const res = await middleware(req);
    expect(mockResolveStakeholderPageRedirect).not.toHaveBeenCalled();
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("does not call stakeholder gate for non-protected public pages", async () => {
    const req = new NextRequest("https://aistroyka.ai/en/features");
    await middleware(req);
    expect(mockResolveStakeholderPageRedirect).not.toHaveBeenCalled();
  });

  it("does not stakeholder-gate platform-admin pages via protected prefix", async () => {
    // /platform-admin is not in PROTECTED_PREFIXES; owner gate handles it separately.
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "owner-1", email: "owner@example.com" },
    });
    const req = new NextRequest("https://aistroyka.ai/en/platform-admin");
    await middleware(req);
    expect(mockResolveStakeholderPageRedirect).not.toHaveBeenCalled();
  });
});
