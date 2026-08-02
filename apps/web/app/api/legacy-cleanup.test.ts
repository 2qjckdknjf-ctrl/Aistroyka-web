/**
 * Phase 2D legacy cleanup — activation/tenant redirects + invite special target + webhook delegate.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEGACY_API_HEADERS } from "@/lib/api/deprecation-headers";

const REDIRECT_ROUTES: Array<{
  name: string;
  method: string;
  url: string;
  location: string;
  sourcePath: string;
  load: () => Promise<(req: Request) => Promise<Response>>;
}> = [
  {
    name: "GET /api/activation/status",
    method: "GET",
    url: "https://x/api/activation/status?locale=en",
    location: "https://x/api/v1/activation/status?locale=en",
    sourcePath: "app/api/activation/status/route.ts",
    load: async () => (await import("@/app/api/activation/status/route")).GET,
  },
  {
    name: "POST /api/invite → /api/v1/tenant/invite",
    method: "POST",
    url: "https://x/api/invite?src=legacy",
    location: "https://x/api/v1/tenant/invite?src=legacy",
    sourcePath: "app/api/invite/route.ts",
    load: async () => (await import("@/app/api/invite/route")).POST,
  },
  {
    name: "POST /api/tenant/accept-invite",
    method: "POST",
    url: "https://x/api/tenant/accept-invite",
    location: "https://x/api/v1/tenant/accept-invite",
    sourcePath: "app/api/tenant/accept-invite/route.ts",
    load: async () => (await import("@/app/api/tenant/accept-invite/route")).POST,
  },
  {
    name: "GET /api/tenant/invitations",
    method: "GET",
    url: "https://x/api/tenant/invitations?page=2",
    location: "https://x/api/v1/tenant/invitations?page=2",
    sourcePath: "app/api/tenant/invitations/route.ts",
    load: async () => (await import("@/app/api/tenant/invitations/route")).GET,
  },
  {
    name: "POST /api/tenant/invite",
    method: "POST",
    url: "https://x/api/tenant/invite",
    location: "https://x/api/v1/tenant/invite",
    sourcePath: "app/api/tenant/invite/route.ts",
    load: async () => (await import("@/app/api/tenant/invite/route")).POST,
  },
  {
    name: "GET /api/tenant/members",
    method: "GET",
    url: "https://x/api/tenant/members",
    location: "https://x/api/v1/tenant/members",
    sourcePath: "app/api/tenant/members/route.ts",
    load: async () => (await import("@/app/api/tenant/members/route")).GET,
  },
  {
    name: "PATCH /api/tenant/profile",
    method: "PATCH",
    url: "https://x/api/tenant/profile",
    location: "https://x/api/v1/tenant/profile",
    sourcePath: "app/api/tenant/profile/route.ts",
    load: async () => (await import("@/app/api/tenant/profile/route")).PATCH,
  },
  {
    name: "POST /api/tenant/revoke",
    method: "POST",
    url: "https://x/api/tenant/revoke",
    location: "https://x/api/v1/tenant/revoke",
    sourcePath: "app/api/tenant/revoke/route.ts",
    load: async () => (await import("@/app/api/tenant/revoke/route")).POST,
  },
];

describe("2D legacy cleanup redirects", () => {
  for (const route of REDIRECT_ROUTES) {
    it(`${route.name} returns 307 to exact canonical Location with deprecation headers`, async () => {
      const src = readFileSync(join(process.cwd(), route.sourcePath), "utf8");
      expect(src).not.toMatch(/@\/lib\/supabase|createClient|getTenantContext|listProjects/);
      expect(src).toMatch(/redirect(?:DeprecatedApiToV1|ToV1PreservePath)/);

      const handler = await route.load();
      const body =
        route.method === "GET"
          ? undefined
          : JSON.stringify({ email: "a@example.com", name: "Workspace" });
      const req = new Request(route.url, {
        method: route.method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body,
      });
      const res = await handler(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(route.location);
      expect(res.headers.get("Deprecation")).toBe("true");
      expect(res.headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
      expect(res.headers.get("Link")).toMatch(/rel="successor"/);
      expect(req.bodyUsed).toBe(false);
    });
  }

  it("/api/invite must not target nonexistent /api/v1/invite", async () => {
    const { POST } = await import("@/app/api/invite/route");
    const res = await POST(new Request("https://x/api/invite", { method: "POST" }));
    const loc = res.headers.get("location")!;
    expect(loc).toContain("/api/v1/tenant/invite");
    expect(loc).not.toContain("/api/v1/invite");
    expect(loc).not.toMatch(/\/api\/v1\/invite(\?|$)/);
  });

  it("trailing slash on activation still maps under /api/v1 without loop", async () => {
    const { GET } = await import("@/app/api/activation/status/route");
    const res = await GET(new Request("https://x/api/activation/status/?x=1", { method: "GET" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://x/api/v1/activation/status/?x=1");
    expect(res.headers.get("location")!.includes("/api/v1/v1/")).toBe(false);
  });
});

describe("2D legacy cleanup webhook delegate", () => {
  const mockV1Post = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockV1Post.mockReset();
  });

  it("delegates once without redirect and adds deprecation headers", async () => {
    mockV1Post.mockImplementation(async (req: Request) => {
      expect(req.bodyUsed).toBe(false);
      const text = await req.text();
      expect(text).toBe('{"event":"ping"}');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "content-type": "application/json", "x-webhook": "ok" },
      });
    });

    vi.doMock("@/app/api/v1/webhooks/incoming/route", () => ({
      dynamic: "force-dynamic",
      POST: mockV1Post,
    }));

    const { POST } = await import("@/app/api/webhooks/incoming/route");
    const req = new Request("https://x/api/webhooks/incoming", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "ping" }),
    });
    const res = await POST(req);
    expect(mockV1Post).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-webhook")).toBe("ok");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
    expect(res.headers.get("Link")).toBe('</api/v1/webhooks/incoming>; rel="successor"');
    expect(await res.json()).toEqual({ received: true });
  });

  it("preserves error status/body from canonical handler", async () => {
    mockV1Post.mockResolvedValue(
      new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );
    vi.doMock("@/app/api/v1/webhooks/incoming/route", () => ({
      dynamic: "force-dynamic",
      POST: mockV1Post,
    }));

    const { POST } = await import("@/app/api/webhooks/incoming/route");
    const res = await POST(
      new Request("https://x/api/webhooks/incoming", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toEqual({ error: "Verification failed" });
    expect(res.headers.get("Deprecation")).toBe("true");
  });
});

describe("2D legacy cleanup active callsite contract", () => {
  it("onboarding/help components fetch canonical /api/v1/activation/status", () => {
    const files = [
      "components/help/HelpStartChecklist.tsx",
      "components/help/AIGuidePanel.tsx",
      "components/onboarding/FirstValueBanner.tsx",
      "components/onboarding/GetStartedPanel.tsx",
      "components/onboarding/LaunchConfidenceBanner.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src, rel).toMatch(/\/api\/v1\/activation\/status/);
      expect(src, rel).not.toMatch(/fetch\(["']\/api\/activation\/status["']/);
    }
  });
});
