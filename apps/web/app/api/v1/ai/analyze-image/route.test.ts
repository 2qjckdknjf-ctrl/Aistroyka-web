import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const getTenantContextFromRequest = vi.fn();
const getProjectForInternalWorkspace = vi.fn();

vi.mock("@/lib/tenant", () => {
  class TenantRequiredError extends Error {
    constructor(message = "Authentication required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return {
    getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
    isTenantContextPresent: (ctx: { tenantId?: string | null; userId?: string | null; role?: string | null }) =>
      Boolean(ctx.tenantId && ctx.userId && ctx.role),
    requireTenant: (ctx: { tenantId?: string | null; userId?: string | null }) => {
      if (!ctx.tenantId) {
        throw new TenantRequiredError(ctx.userId ? "User has no tenant membership" : "Authentication required");
      }
    },
    TenantRequiredError,
  };
});

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: (...args: unknown[]) => getProjectForInternalWorkspace(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

function jsonRequest(body: object) {
  return new Request("http://test/api/v1/ai/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/ai/analyze-image", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: null,
      userId: null,
      subscriptionTier: "free",
    });
    getProjectForInternalWorkspace.mockResolvedValue({ data: { id: "p1" }, error: null });
  });

  it("returns 401 when unauthenticated and no cron secret", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    getTenantContextFromRequest.mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: "free",
    });
    const req = jsonRequest({ image_url: "https://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/Authentication|Tenant|membership/i);
  });

  it("returns 403 when project_id is outside tenant rights", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    getTenantContextFromRequest.mockResolvedValueOnce({
      tenantId: "tenant-a",
      userId: "user-1",
      role: "owner",
      subscriptionTier: "free",
    });
    getProjectForInternalWorkspace.mockResolvedValueOnce({
      data: null,
      error: "Insufficient rights",
    });

    const req = jsonRequest({
      image_url: "https://example.com/photo.jpg",
      project_id: "other-tenant-project",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("Insufficient rights");
  });

  it("returns 503 when no vision provider is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const req = jsonRequest({ image_url: "https://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("No AI vision provider is configured");
  });

  it("returns 400 for invalid JSON body", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = new Request("http://test/api/v1/ai/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("JSON");
  });

  it("returns 400 when image_url is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBeDefined();
    expect(["image_url", "Required", "Invalid"].some((s) => data.error!.includes(s))).toBe(true);
  });

  it("returns 400 when image_url is empty string", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "   " });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("image_url");
  });

  it("returns 400 for invalid URL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "not-a-url" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/valid URL|URL/);
  });

  it("returns 400 for non-http(s) URL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "file:///etc/passwd" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/http|https/);
  });

  it("returns 400 when image_url exceeds max length", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const longUrl = "https://example.com/" + "a".repeat(2048);
    const req = jsonRequest({ image_url: longUrl });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/too long|long/);
  });

  it("returns 413 when content-length exceeds limit", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = new Request("http://test/api/v1/ai/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "200000",
      },
      body: JSON.stringify({ image_url: "https://example.com/photo.jpg" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("too large");
  });

  it("returns 400 for http URL in production", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("NODE_ENV", "production");
    const req = jsonRequest({ image_url: "http://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/https|production/);
  });

  it("does not set legacy Deprecation headers on v1 route", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const req = jsonRequest({ image_url: "https://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.headers.get("Deprecation")).toBeNull();
    expect(res.headers.get("Sunset")).toBeNull();
  });

});
