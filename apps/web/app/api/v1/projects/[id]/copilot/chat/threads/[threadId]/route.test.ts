import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  ctx: {
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace",
  },
  getProject: vi.fn(),
  getCopilotThread: vi.fn(),
  archiveCopilotThread: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue(mocks.ctx),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ client: "request" }),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: (...args: unknown[]) => mocks.getProject(...args),
}));

vi.mock("@/lib/copilot/chat-history.service", () => ({
  getCopilotThread: (...args: unknown[]) => mocks.getCopilotThread(...args),
  archiveCopilotThread: (...args: unknown[]) => mocks.archiveCopilotThread(...args),
}));

describe("copilot thread detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProject.mockResolvedValue({ data: { id: "p1" }, error: null });
    mocks.getCopilotThread.mockResolvedValue({
      data: { thread: { id: "th1" }, messages: [] },
      error: "",
    });
    mocks.archiveCopilotThread.mockResolvedValue({ ok: true, error: "" });
  });

  it("loads only the requested project/thread through the authenticated service", async () => {
    const res = await GET(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads/th1?messages_limit=500"),
      { params: Promise.resolve({ id: "p1", threadId: "th1" }) }
    );
    expect(res.status).toBe(200);
    expect(mocks.getCopilotThread).toHaveBeenCalledWith(
      { client: "request" }, "t1", "u1", "p1", "th1", 500
    );
  });

  it("returns 404 when RLS/service cannot see the thread", async () => {
    mocks.getCopilotThread.mockResolvedValueOnce({ data: null, error: "Not found" });
    const res = await GET(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads/foreign"),
      { params: Promise.resolve({ id: "p1", threadId: "foreign" }) }
    );
    expect(res.status).toBe(404);
  });

  it("allows archive only", async () => {
    const invalid = await PATCH(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads/th1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      }),
      { params: Promise.resolve({ id: "p1", threadId: "th1" }) }
    );
    expect(invalid.status).toBe(400);
    expect(mocks.archiveCopilotThread).not.toHaveBeenCalled();

    const valid = await PATCH(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads/th1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      }),
      { params: Promise.resolve({ id: "p1", threadId: "th1" }) }
    );
    expect(valid.status).toBe(200);
    expect(mocks.archiveCopilotThread).toHaveBeenCalledWith(
      { client: "request" }, "t1", "u1", "p1", "th1"
    );
  });
});
