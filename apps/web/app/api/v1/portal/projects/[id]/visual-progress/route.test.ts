import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as ownerEvidence from "@/lib/domain/portal/owner-evidence.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

const getTenantContextFromRequest = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/domain/portal/owner-evidence.service", () => ({
  getOwnerPortalVisualProgress: vi.fn(),
}));

describe("GET /api/v1/portal/projects/:id/visual-progress tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for insufficient rights (cross-project)", async () => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "u1",
      role: "stakeholder",
    });
    vi.mocked(ownerEvidence.getOwnerPortalVisualProgress).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p-foreign/visual-progress"), {
      params: Promise.resolve({ id: "p-foreign" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 for missing project", async () => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "u1",
      role: "stakeholder",
    });
    vi.mocked(ownerEvidence.getOwnerPortalVisualProgress).mockResolvedValue({
      data: null,
      error: "Project not found",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/visual-progress"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns safe payload without storage paths", async () => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-a",
      userId: "u1",
      role: "stakeholder",
    });
    vi.mocked(ownerEvidence.getOwnerPortalVisualProgress).mockResolvedValue({
      data: {
        project: { id: "p1", name: "Tower" },
        items: [
          {
            id: "e1",
            signed_image_url: "https://signed.example/x",
            signed_url_expires_in_sec: 900,
            image_unavailable_reason: null,
          },
        ],
        stale: false,
        last_updated_at: null,
      } as never,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/visual-progress"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(JSON.stringify(json)).not.toMatch(/object_path|file_url|storage\/v1\/object\/public/i);
  });
});
