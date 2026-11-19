import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const mockRequirePlatformOwnerApi = vi.fn();

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: (...args: unknown[]) => mockRequirePlatformOwnerApi(...args),
}));

describe("GET /api/v1/owner/health (legacy alias → platform)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the owner gate denies the caller", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "forbidden", code: "owner_gate" }, { status: 403 }),
    });
    const res = await GET(new Request("https://x/api/v1/owner/health"));
    expect(res.status).toBe(403);
  });

  it("returns ok payload when the owner gate allows the caller", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue({
      ok: true,
      supabase: {},
      userId: "owner-1",
      role: "OWNER",
    });
    const res = await GET(new Request("https://x/api/v1/owner/health"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, userId: "owner-1", role: "OWNER" });
  });
});
