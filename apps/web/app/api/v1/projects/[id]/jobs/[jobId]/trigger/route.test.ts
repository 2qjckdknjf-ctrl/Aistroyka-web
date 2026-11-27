import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  createClientFromRequest: vi.fn(),
  createClient: vi.fn(),
  getProjectById: vi.fn(),
  hasMinRole: vi.fn(),
  from: vi.fn(),
  triggerAnalysisJobRpc: vi.fn(),
  getAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => fake.createClientFromRequest(...args),
  createClient: (...args: unknown[]) => fake.createClient(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => fake.getAdminClient(),
}));
vi.mock("@/lib/supabase/rpc", () => ({
  getProjectById: (...args: unknown[]) => fake.getProjectById(...args),
}));
vi.mock("@/lib/auth/tenant", () => ({
  hasMinRole: (...args: unknown[]) => fake.hasMinRole(...args),
}));
vi.mock("@/lib/api/rpcClient", () => ({
  triggerAnalysisJobRpc: (...args: unknown[]) => fake.triggerAnalysisJobRpc(...args),
}));

import { POST } from "./route";

describe("POST /api/v1/projects/:id/jobs/:jobId/trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fake.createClientFromRequest.mockResolvedValue({ from: fake.from });
    fake.getProjectById.mockResolvedValue({ data: { tenant_id: "tenant-1" } });
    fake.hasMinRole.mockResolvedValue(true);
    fake.from.mockImplementation((table: string) => {
      if (table === "analysis_jobs") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "job-1", tenant_id: "tenant-1", media_id: "media-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "media") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { project_id: "00000000-0000-4000-8000-000000000001" },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });
    fake.getAdminClient.mockReturnValue({ admin: true });
    fake.triggerAnalysisJobRpc.mockResolvedValue({ id: "job-1", status: "queued" });
  });

  it("uses request-bound Supabase client for Bearer Authorization", async () => {
    const request = new Request("https://test/trigger", {
      method: "POST",
      headers: { Authorization: "Bearer user.jwt" },
    });
    const res = await POST(request, {
      params: Promise.resolve({
        id: "00000000-0000-4000-8000-000000000001",
        jobId: "job-1",
      }),
    });
    expect(res.status).toBe(200);
    expect(fake.createClientFromRequest).toHaveBeenCalledWith(request);
    expect(fake.createClient).not.toHaveBeenCalled();
    expect(fake.triggerAnalysisJobRpc).toHaveBeenCalled();
  });
});
