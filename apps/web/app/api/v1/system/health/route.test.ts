import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/system/system-route-auth", () => ({
  requireSystemRouteAuth: vi.fn(),
}));

vi.mock("@/lib/system/health.service", () => ({
  getSystemHealth: vi.fn(),
}));

import { GET } from "./route";
import { requireSystemRouteAuth } from "@/lib/system/system-route-auth";
import { getSystemHealth } from "@/lib/system/health.service";

const requireSystemRouteAuthMock = vi.mocked(requireSystemRouteAuth);
const getSystemHealthMock = vi.mocked(getSystemHealth);

describe("GET /api/v1/system/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns auth response when key is missing/wrong", async () => {
    requireSystemRouteAuthMock.mockReturnValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );

    const response = await GET(new Request("https://example.com/api/v1/system/health"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(getSystemHealthMock).not.toHaveBeenCalled();
  });

  it("returns diagnostic payload when auth passes", async () => {
    requireSystemRouteAuthMock.mockReturnValue(null);
    getSystemHealthMock.mockResolvedValue({
      status: "ok",
      timestamp: "2026-05-20T00:00:00.000Z",
      buildStamp: { sha7: "abcdef1", buildTime: "2026-05-20 00:00" },
      services: {
        database: "ok",
        ai_brain: "ok",
        copilot: "ok",
        workflows: "ok",
        events: "ok",
        alerts: "ok",
      },
    });

    const response = await GET(new Request("https://example.com/api/v1/system/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.buildStamp?.sha7).toBe("abcdef1");
  });
});

