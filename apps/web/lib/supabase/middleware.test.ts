import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "./middleware";

vi.mock("@/lib/env", () => ({
  getPublicEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  })),
  hasSupabaseEnv: vi.fn(() => true),
}));

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

function createRequest(url = "https://aistroyka.ai/ru/dashboard"): NextRequest {
  return new NextRequest(url, {
    headers: new Headers(),
  });
}

describe("updateSession", () => {
  it("returns user when getUser returns data.user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "u1", email: "u@test.com" } },
      error: null,
    });
    const req = createRequest();
    const { response, user } = await updateSession(req);
    expect(response.status).toBe(200);
    expect(user).toEqual({ id: "u1", email: "u@test.com" });
  });

  it("returns null user when getUser returns data.user null (does not throw)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = createRequest();
    const { response, user } = await updateSession(req);
    expect(response.status).toBe(200);
    expect(user).toBeNull();
  });

  it("returns null user when getUser returns data undefined (safe destructuring)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: undefined, error: { message: "session missing" } });
    const req = createRequest();
    const { response, user } = await updateSession(req);
    expect(response.status).toBe(200);
    expect(user).toBeNull();
  });

  it("returns null user when getUser throws (middleware must not crash)", async () => {
    mockGetUser.mockRejectedValueOnce(new Error("Auth server timeout"));
    const req = createRequest();
    const { response, user } = await updateSession(req);
    expect(response.status).toBe(200);
    expect(user).toBeNull();
  });
});
