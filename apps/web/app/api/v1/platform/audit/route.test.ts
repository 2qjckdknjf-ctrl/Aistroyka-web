import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const mockRequirePlatformOwnerApi = vi.fn();
const mockGetAdminClient = vi.fn();

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: (...args: unknown[]) => mockRequirePlatformOwnerApi(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

describe("GET /api/v1/platform/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the owner gate denies the caller", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }),
    });
    const res = await GET(new Request("https://x/api/v1/platform/audit"));
    expect(res.status).toBe(403);
    expect(mockGetAdminClient).not.toHaveBeenCalled();
  });

  it("returns 503 when the admin client is unavailable", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue({
      ok: true,
      supabase: {},
      userId: "owner-1",
      role: "OWNER",
    });
    mockGetAdminClient.mockReturnValue(null);
    const res = await GET(new Request("https://x/api/v1/platform/audit"));
    expect(res.status).toBe(503);
  });
});
