import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const getOrCreateTenantForCurrentUser = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/api/engine", () => ({
  getOrCreateTenantForCurrentUser: (...args: unknown[]) => getOrCreateTenantForCurrentUser(...args),
}));

describe("GET /api/v1/activation/status", () => {
  beforeEach(() => {
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    getOrCreateTenantForCurrentUser.mockResolvedValue(null);
  });

  it("uses the request-bound Supabase client for Bearer-only mobile clients", async () => {
    const request = new Request("https://test/api/v1/activation/status", {
      headers: { Authorization: "Bearer token", "x-client": "ios_worker" },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(getOrCreateTenantForCurrentUser).toHaveBeenCalledWith({ client: "request-bound" });
  });
});
