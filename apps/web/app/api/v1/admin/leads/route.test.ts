import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: vi.fn().mockResolvedValue({ ok: true, supabase: {}, userId: "u1", role: "OWNER" }),
}));

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("GET /api/v1/admin/leads (deprecated alias)", () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
      eq: mockEq,
    });
    mockLimit.mockResolvedValue({
      data: [
        {
          id: "lead-1",
          created_at: "2026-03-19T12:00:00Z",
          name: "Alice",
          email: "alice@example.com",
          company: "Co",
          message: "Hi",
          source: "contact_form",
          status: "new",
          notes: null,
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ limit: mockLimit });
  });

  it("returns 200 with leads list and deprecation header", async () => {
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Deprecation")).toBe("true");
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Alice");
  });

  it("returns 403 when platform owner grant is required", async () => {
    const { requirePlatformOwnerApi } = await import("@/lib/platform-owner/require-platform-owner-api");
    const { NextResponse } = await import("next/server");
    vi.mocked(requirePlatformOwnerApi).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }),
    });
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
