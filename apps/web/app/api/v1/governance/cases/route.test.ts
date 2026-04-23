import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as govService from "@/lib/domain/governance/governance.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/governance/governance.service");

describe("GET /api/v1/governance/cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(govService.listGovernanceCasesForTenant).mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("returns cases list", async () => {
    const res = await GET(new Request("https://test/api/v1/governance/cases"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.data).toEqual([]);
  });
});

describe("POST /api/v1/governance/cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when body incomplete", async () => {
    const res = await POST(
      new Request("https://test/api/v1/governance/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "x" }),
      })
    );
    expect(res.status).toBe(400);
  });
});
