import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as admin from "@/lib/supabase/admin";
import * as proofPackService from "@/lib/domain/proof-pack/proof-pack.service";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/domain/proof-pack/proof-pack.service", () => ({
  getProofPackByToken: vi.fn(),
}));

describe("GET /api/v1/share/proof/:token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when service role client is not configured", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue(null);
    const res = await GET(new Request("https://test/api/v1/share/proof/abc"), {
      params: Promise.resolve({ token: "abc" }),
    });
    expect(res.status).toBe(503);
  });

  it("returns 404 when token resolves to no pack", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(proofPackService.getProofPackByToken).mockResolvedValue({ data: null, error: "Not found" });
    const res = await GET(new Request("https://test/api/v1/share/proof/tok"), {
      params: Promise.resolve({ token: "tok" }),
    });
    expect(res.status).toBe(404);
    expect(proofPackService.getProofPackByToken).toHaveBeenCalledWith(expect.anything(), "tok");
  });

  it("returns shaped data on success", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(proofPackService.getProofPackByToken).mockResolvedValue({
      data: {
        generated_at: "2026-01-01",
        project: { id: "p1", name: "House" },
        progress: { tasks_done: 1, tasks_total: 2 },
        media: [],
        documents: [],
        decisions: [],
        approved_commercial_changes: [],
      },
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/share/proof/tok"), {
      params: Promise.resolve({ token: "tok" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.project.name).toBe("House");
  });
});
