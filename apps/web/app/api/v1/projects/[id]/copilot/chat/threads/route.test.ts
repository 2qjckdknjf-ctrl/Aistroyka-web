import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

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
  listCopilotThreads: vi.fn(),
  createCopilotThread: vi.fn(),
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
  listCopilotThreads: (...args: unknown[]) => mocks.listCopilotThreads(...args),
  createCopilotThread: (...args: unknown[]) => mocks.createCopilotThread(...args),
}));

describe("copilot thread collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProject.mockResolvedValue({ data: { id: "p1" }, error: null });
    mocks.listCopilotThreads.mockResolvedValue({ data: [{ id: "th1" }], error: "" });
    mocks.createCopilotThread.mockResolvedValue({ data: { id: "th2" }, error: "" });
  });

  it("lists project-scoped threads for the authenticated user", async () => {
    const res = await GET(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads?limit=999"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);
    expect(mocks.listCopilotThreads).toHaveBeenCalledWith(
      { client: "request" }, "t1", "u1", "p1", 999
    );
  });

  it("creates a thread only after project authorization", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/p1/copilot/chat/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Site chat" }),
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(201);
    expect(mocks.createCopilotThread).toHaveBeenCalledWith(
      { client: "request" }, "t1", "u1", "p1", "Site chat"
    );
  });

  it("rejects a project outside the caller's rights before history access", async () => {
    mocks.getProject.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const res = await GET(
      new Request("https://test/api/v1/projects/p2/copilot/chat/threads"),
      { params: Promise.resolve({ id: "p2" }) }
    );
    expect(res.status).toBe(403);
    expect(mocks.listCopilotThreads).not.toHaveBeenCalled();
  });
});
