import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockGetActiveTenantRoleForUser = vi.fn();
const mockHasSupabaseEnv = vi.fn();
const mockGetPublicEnv = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock("./tenant-role.server", () => ({
  getActiveTenantRoleForUser: (...args: unknown[]) => mockGetActiveTenantRoleForUser(...args),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: (...args: unknown[]) => mockHasSupabaseEnv(...args),
  getPublicEnv: (...args: unknown[]) => mockGetPublicEnv(...args),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

import { resolveStakeholderPageRedirect } from "./stakeholder-middleware-gate";

describe("resolveStakeholderPageRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSupabaseEnv.mockReturnValue(true);
    mockGetPublicEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    mockCreateServerClient.mockReturnValue({ __supabase: true });
  });

  it("returns null when supabase env missing", async () => {
    mockHasSupabaseEnv.mockReturnValue(false);
    const res = await resolveStakeholderPageRedirect({
      request: new NextRequest("https://aistroyka.ai/en/dashboard/tasks"),
      sessionResponse: NextResponse.next(),
      userId: "u1",
      pathWithoutLocale: "/dashboard/tasks",
      locale: "en",
    });
    expect(res).toBeNull();
    expect(mockGetActiveTenantRoleForUser).not.toHaveBeenCalled();
  });

  it("returns null for non-stakeholder roles", async () => {
    for (const role of ["owner", "admin", "member", "viewer"] as const) {
      mockGetActiveTenantRoleForUser.mockResolvedValueOnce(role);
      const res = await resolveStakeholderPageRedirect({
        request: new NextRequest("https://aistroyka.ai/en/dashboard/tasks"),
        sessionResponse: NextResponse.next(),
        userId: "u1",
        pathWithoutLocale: "/dashboard/tasks",
        locale: "en",
      });
      expect(res).toBeNull();
    }
  });

  it("fail-closed redirects stakeholder off blocked dashboard path", async () => {
    mockGetActiveTenantRoleForUser.mockResolvedValue("stakeholder");
    const res = await resolveStakeholderPageRedirect({
      request: new NextRequest("https://aistroyka.ai/en/dashboard/tasks"),
      sessionResponse: NextResponse.next(),
      userId: "stake-1",
      pathWithoutLocale: "/dashboard/tasks",
      locale: "en",
    });
    expect(res).not.toBeNull();
    expect(res!.status).toBeGreaterThanOrEqual(300);
    expect(res!.headers.get("location")).toBe("https://aistroyka.ai/en/portal/projects");
  });

  it("allows stakeholder on portal projects and dashboard client path", async () => {
    mockGetActiveTenantRoleForUser.mockResolvedValue("stakeholder");
    await expect(
      resolveStakeholderPageRedirect({
        request: new NextRequest("https://aistroyka.ai/en/portal/projects"),
        sessionResponse: NextResponse.next(),
        userId: "stake-1",
        pathWithoutLocale: "/portal/projects",
        locale: "en",
      })
    ).resolves.toBeNull();

    mockGetActiveTenantRoleForUser.mockResolvedValue("stakeholder");
    await expect(
      resolveStakeholderPageRedirect({
        request: new NextRequest("https://aistroyka.ai/en/dashboard/projects/p1/client"),
        sessionResponse: NextResponse.next(),
        userId: "stake-1",
        pathWithoutLocale: "/dashboard/projects/p1/client",
        locale: "en",
      })
    ).resolves.toBeNull();
  });

  it("redirects stakeholder portal root and billing", async () => {
    mockGetActiveTenantRoleForUser.mockResolvedValue("stakeholder");
    const portal = await resolveStakeholderPageRedirect({
      request: new NextRequest("https://aistroyka.ai/ru/portal"),
      sessionResponse: NextResponse.next(),
      userId: "stake-1",
      pathWithoutLocale: "/portal",
      locale: "ru",
    });
    expect(portal?.headers.get("location")).toBe("https://aistroyka.ai/ru/portal/projects");

    mockGetActiveTenantRoleForUser.mockResolvedValue("stakeholder");
    const billing = await resolveStakeholderPageRedirect({
      request: new NextRequest("https://aistroyka.ai/en/billing"),
      sessionResponse: NextResponse.next(),
      userId: "stake-1",
      pathWithoutLocale: "/billing",
      locale: "en",
    });
    expect(billing?.headers.get("location")).toBe("https://aistroyka.ai/en/portal/projects");
  });

  it("returns null on role lookup errors (no global lockout)", async () => {
    mockGetActiveTenantRoleForUser.mockRejectedValue(new Error("db down"));
    const res = await resolveStakeholderPageRedirect({
      request: new NextRequest("https://aistroyka.ai/en/dashboard/tasks"),
      sessionResponse: NextResponse.next(),
      userId: "u1",
      pathWithoutLocale: "/dashboard/tasks",
      locale: "en",
    });
    expect(res).toBeNull();
  });
});
