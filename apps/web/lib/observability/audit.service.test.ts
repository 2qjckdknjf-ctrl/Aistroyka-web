import { describe, expect, it, vi, beforeEach } from "vitest";
import { emitAudit, emitAiRuntimeAudit, listAuditLogs } from "./audit.service";

describe("audit.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("emitAudit does not throw on insert failure", async () => {
    const supabase = {
      from: () => ({ insert: () => Promise.reject(new Error("db error")) }),
    } as any;
    await expect(emitAudit(supabase, { tenant_id: "t", action: "login" })).resolves.toBeUndefined();
  });

  it("emitAiRuntimeAudit persists ai_runtime action with safe details", async () => {
    const insertMock = vi.fn().mockResolvedValue({});
    const supabase = { from: vi.fn().mockReturnValue({ insert: insertMock }) } as any;
    await emitAiRuntimeAudit(supabase, {
      tenant_id: "t1",
      user_id: "u1",
      trace_id: "req-1",
      project_id: "p1",
      action: "ai_copilot_stream_complete",
      details: {
        request_id: "req-1",
        route: "POST /api/v1/projects/:id/copilot/chat/stream",
        latency_ms: 500,
        output_type: "copilot",
        streaming: true,
        provider: "openai",
      },
    });
    expect(supabase.from).toHaveBeenCalledWith("audit_logs");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "t1",
        user_id: "u1",
        trace_id: "req-1",
        action: "ai_copilot_stream_complete",
        resource_type: "ai_runtime",
        resource_id: "p1",
        details: expect.objectContaining({
          request_id: "req-1",
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          latency_ms: 500,
          output_type: "copilot",
          streaming: true,
          provider: "openai",
        }),
      })
    );
  });

  it("listAuditLogs returns empty when query errors", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: new Error("err") }) }) }) }) }),
      }),
    } as any;
    const rows = await listAuditLogs(supabase, "t", 30);
    expect(rows).toEqual([]);
  });
});
