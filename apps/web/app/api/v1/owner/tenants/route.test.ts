import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const mockRequirePlatformOwnerApi = vi.fn();

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: (...args: unknown[]) => mockRequirePlatformOwnerApi(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => null),
}));

describe("GET /api/v1/owner/tenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the owner gate denies the caller", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }),
    });
    const res = await GET(new Request("https://x/api/v1/owner/tenants"));
    expect(res.status).toBe(403);
  });
});
