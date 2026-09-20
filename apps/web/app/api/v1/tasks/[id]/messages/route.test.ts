import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  IDEMPOTENCY_HEADER: "x-idempotency-key",
  getCachedResponse: vi.fn(),
  storeResponse: vi.fn(),
}));

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: (_req: Request, res: Response) => res,
}));

vi.mock("@/lib/api/request-limit", () => ({
  checkRequestBodySize: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/domain/task-messages/task-messages.service", () => ({
  listTaskMessages: vi.fn(),
  createTaskMessage: vi.fn(),
}));

import { listTaskMessages, createTaskMessage } from "@/lib/domain/task-messages/task-messages.service";

describe("GET /api/v1/tasks/:id/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns messages on success", async () => {
    vi.mocked(listTaskMessages).mockResolvedValue({
      result: {
        data: [
          {
            id: "m1",
            tenant_id: "t1",
            project_id: "p1",
            task_id: "task-1",
            sender_user_id: "u1",
            kind: "text",
            body: "hello",
            upload_session_id: null,
            duration_ms: null,
            client_id: null,
            created_at: "2026-07-18T10:00:00Z",
            edited_at: null,
            deleted_at: null,
          },
        ],
        nextCursor: null,
      },
      error: "",
      status: 200,
    });
    const res = await GET(new Request("https://test/api/v1/tasks/task-1/messages"), {
      params: Promise.resolve({ id: "task-1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].body).toBe("hello");
  });

  it("returns 403 when not assigned", async () => {
    vi.mocked(listTaskMessages).mockResolvedValue({
      result: null,
      error: "Task not assigned",
      status: 403,
      code: "task_not_assigned",
    });
    const res = await GET(new Request("https://test/api/v1/tasks/task-1/messages"), {
      params: Promise.resolve({ id: "task-1" }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("task_not_assigned");
  });

  it("forwards tail=1 so clients can load the newest chat window", async () => {
    vi.mocked(listTaskMessages).mockResolvedValue({
      result: { data: [], nextCursor: null },
      error: "",
      status: 200,
    });
    const res = await GET(
      new Request("https://test/api/v1/tasks/task-1/messages?limit=80&tail=1"),
      { params: Promise.resolve({ id: "task-1" }) }
    );
    expect(res.status).toBe(200);
    expect(listTaskMessages).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "task-1",
      expect.objectContaining({ limit: 80, tail: true })
    );
  });
});

describe("POST /api/v1/tasks/:id/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates text message", async () => {
    vi.mocked(createTaskMessage).mockResolvedValue({
      data: {
        id: "m2",
        tenant_id: "t1",
        project_id: "p1",
        task_id: "task-1",
        sender_user_id: "u1",
        kind: "text",
        body: "hi",
        upload_session_id: null,
        duration_ms: null,
        client_id: "c1",
        created_at: "2026-07-18T10:01:00Z",
        edited_at: null,
        deleted_at: null,
      },
      error: "",
      status: 201,
    });
    const res = await POST(
      new Request("https://test/api/v1/tasks/task-1/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "text", body: "hi", clientId: "c1" }),
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.kind).toBe("text");
  });

  it("returns 400 for invalid media", async () => {
    vi.mocked(createTaskMessage).mockResolvedValue({
      data: null,
      error: "MIME type does not match message kind",
      status: 400,
      code: "media_mime",
    });
    const res = await POST(
      new Request("https://test/api/v1/tasks/task-1/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "voice", mediaId: "s1" }),
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("media_mime");
  });
});
