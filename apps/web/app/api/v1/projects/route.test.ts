import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const {
  mockGetTenantContextFromRequest,
  mockCreateClientFromRequest,
  mockListProjects,
  mockCreateProject,
  MockTenantRequiredError,
} = vi.hoisted(() => {
  class MockTenantRequiredError extends Error {
    constructor(message = "User has no tenant membership") {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return {
    mockGetTenantContextFromRequest: vi.fn(),
    mockCreateClientFromRequest: vi.fn(),
    mockListProjects: vi.fn(),
    mockCreateProject: vi.fn(),
    MockTenantRequiredError,
  };
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...a: unknown[]) => mockGetTenantContextFromRequest(...a),
  requireTenant: (ctx: { tenantId?: string | null; userId?: string | null }) => {
    if (!ctx?.userId) throw new MockTenantRequiredError("Authentication required");
    if (!ctx?.tenantId) throw new MockTenantRequiredError("User has no tenant membership");
  },
  TenantRequiredError: MockTenantRequiredError,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...a: unknown[]) => mockCreateClientFromRequest(...a),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  listProjects: (...a: unknown[]) => mockListProjects(...a),
  createProject: (...a: unknown[]) => mockCreateProject(...a),
}));

import { GET, POST } from "./route";

describe("GET/POST /api/v1/projects (canonical)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClientFromRequest.mockResolvedValue({});
  });

  it("source does not re-export legacy /api/projects handlers", () => {
    const src = readFileSync(join(process.cwd(), "app/api/v1/projects/route.ts"), "utf8");
    expect(src).not.toMatch(/@\/app\/api\/projects\/route/);
  });

  it("GET lists projects for authenticated tenant", async () => {
    mockGetTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "owner",
      clientProfile: "web",
    });
    mockListProjects.mockResolvedValue({ data: [{ id: "p1", name: "A" }], error: null });
    const res = await GET(new Request("https://x/api/v1/projects", { method: "GET" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toHaveLength(1);
    expect(mockListProjects).toHaveBeenCalled();
  });

  it("POST creates a project", async () => {
    mockGetTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "owner",
      clientProfile: "web",
    });
    mockCreateProject.mockResolvedValue({ id: "new-1" });
    const res = await POST(
      new Request("https://x/api/v1/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Site A" }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { id: string } };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("new-1");
    expect(mockCreateProject).toHaveBeenCalled();
  });

  it("GET returns 401 without tenant", async () => {
    mockGetTenantContextFromRequest.mockResolvedValue({
      tenantId: null,
      userId: null,
      role: null,
      clientProfile: "web",
    });
    const res = await GET(new Request("https://x/api/v1/projects", { method: "GET" }));
    expect(res.status).toBe(401);
  });
});
