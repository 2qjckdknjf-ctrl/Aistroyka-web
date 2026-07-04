import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_API_PREFIX } from "@/lib/platform-admin/constants";

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

import { middleware } from "./middleware";

describe("middleware admin host routing", () => {
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

  it("redirects admin host / to /ru/platform-admin", async () => {
    const req = new NextRequest("https://admin.aistroyka.ai/", {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://admin.aistroyka.ai/ru/platform-admin");
    expect(res.headers.get("X-Aistroyka-Host-Routing")).toBe("platform_admin_landing");
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBe("platform_admin");
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it("redirects admin host marketing paths to platform-admin landing", async () => {
    const req = new NextRequest("https://admin.aistroyka.ai/ru/features", {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://admin.aistroyka.ai/ru/platform-admin");
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it("keeps public host / on normal intl flow", async () => {
    const req = new NextRequest("https://aistroyka.ai/", {
      headers: { host: "aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBe("public_product");
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it("keeps public host /ru/platform-admin compatibility during transition", async () => {
    mockUpdateSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: { id: "owner-user-id", email: "owner@example.com" },
    });
    const req = new NextRequest("https://aistroyka.ai/ru/platform-admin", {
      headers: { host: "aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(mockIntlMiddleware).toHaveBeenCalled();
    expect(mockGateOwnerRequest).toHaveBeenCalled();
  });

  it("redirects unauthenticated platform-admin page to login with next", async () => {
    const req = new NextRequest("https://admin.aistroyka.ai/ru/platform-admin", {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get("location")).toBe(
      "https://admin.aistroyka.ai/ru/login?next=%2Fru%2Fplatform-admin"
    );
    expect(res.headers.get("X-Auth-Redirect")).toBe("platform-admin-login");
    expect(mockGateOwnerRequest).not.toHaveBeenCalled();
  });

  it("includes platform API in protected middleware flow on admin host", async () => {
    const req = new NextRequest(`https://admin.aistroyka.ai${PLATFORM_API_PREFIX}/overview`, {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(mockGateOwnerRequest).toHaveBeenCalled();
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBe("platform_admin");
  });

  it("blocks tenant admin API on admin host", async () => {
    const req = new NextRequest("https://admin.aistroyka.ai/api/v1/admin/flags", {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("admin_host_api_forbidden");
    expect(mockGateOwnerRequest).not.toHaveBeenCalled();
  });

  it("passes admin host health through without app block", async () => {
    const req = new NextRequest("https://admin.aistroyka.ai/api/v1/health", {
      headers: { host: "admin.aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(mockGateOwnerRequest).not.toHaveBeenCalled();
  });

  it("preserves public host health pass-through", async () => {
    const req = new NextRequest("https://aistroyka.ai/api/v1/health", {
      headers: { host: "aistroyka.ai" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Aistroyka-Host-Profile")).toBe("public_product");
  });
});
