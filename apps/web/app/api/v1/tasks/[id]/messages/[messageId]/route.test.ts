import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

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

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: (_req: Request, res: Response) => res,
}));

vi.mock("@/lib/domain/task-messages/task-messages.service", () => ({
  softDeleteTaskMessage: vi.fn(),
}));

import { softDeleteTaskMessage } from "@/lib/domain/task-messages/task-messages.service";

describe("DELETE /api/v1/tasks/:id/messages/:messageId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok on soft-delete", async () => {
    vi.mocked(softDeleteTaskMessage).mockResolvedValue({ ok: true, error: "", status: 200 });
    const res = await DELETE(new Request("https://test/api/v1/tasks/task-1/messages/m1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "task-1", messageId: "m1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 404 when missing", async () => {
    vi.mocked(softDeleteTaskMessage).mockResolvedValue({
      ok: false,
      error: "Not found",
      status: 404,
    });
    const res = await DELETE(new Request("https://test/api/v1/tasks/task-1/messages/m1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "task-1", messageId: "m1" }),
    });
    expect(res.status).toBe(404);
  });
});
