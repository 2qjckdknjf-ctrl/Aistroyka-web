import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const getUser = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const createServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}));

vi.mock("@/lib/config", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/observability", () => ({
  getOrCreateTraceId: () => "trace-1",
  logStructured: vi.fn(),
}));

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
    createServerClient.mockReturnValue({
      auth: { getUser, updateUser, signOut },
    });
  });

  it("rejects short passwords", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "short", confirmPassword: "short" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it("updates password when session exists", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "longenough", confirmPassword: "longenough" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith({ password: "longenough" });
    expect(signOut).toHaveBeenCalled();
  });

  it("rejects when recovery session is missing", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("no session") });
    const request = new Request("https://aistroyka.ai/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "longenough", confirmPassword: "longenough" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });
});
