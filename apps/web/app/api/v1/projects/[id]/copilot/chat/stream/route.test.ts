/**
 * Focused tests for Copilot chat stream route:
 * - 400 on invalid body
 * - 503 when OpenAI not configured
 * - 200 with stream and correct headers when configured (mocked fetch)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => {
  const createFromChain = (overrides: Record<string, unknown> = {}) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    ...overrides,
  });
  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === "ai_chat_threads") {
        return createFromChain({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "thread-1" }, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
      }
      if (table === "ai_chat_messages") {
        return createFromChain({
          insert: vi.fn()
            .mockResolvedValueOnce({ error: null })
            .mockReturnValueOnce({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "msg-1" }, error: null }),
              }),
            }),
        });
      }
      return createFromChain();
    }),
  };
  return {
    createClientFromRequest: vi.fn().mockResolvedValue(mockSupabase),
  };
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "manager",
    subscriptionTier: null,
    clientProfile: "web",
    traceId: "trace-1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor() {
      super("Tenant required");
    }
  },
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: vi.fn().mockResolvedValue({
    data: { id: "p1", name: "Project" },
    error: null,
  }),
}));

vi.mock("@/lib/copilot/copilot-stream-memory", () => ({
  loadCopilotStreamMemoryChunks: vi.fn().mockResolvedValue([]),
  formatMemoryContextSection: vi.fn(() => ""),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/copilot/copilot-ai-gate", () => ({
  gateCopilotLlmRequest: vi.fn().mockResolvedValue({ ok: true }),
  COPILOT_STREAM_ESTIMATE_USD: 0.01,
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  recordUsage: vi.fn().mockResolvedValue(undefined),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn().mockReturnValue({
    OPENAI_API_KEY: "sk-test",
    OPENAI_COPILOT_MODEL: "gpt-4o-mini",
    OPENAI_COPILOT_TIMEOUT_MS: 60_000,
    OPENAI_COPILOT_MAX_RETRIES: 0,
  }),
  isOpenAIConfigured: vi.fn().mockReturnValue(true),
}));

describe("POST /api/v1/projects/:id/copilot/chat/stream", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isOpenAIConfigured } = await import("@/lib/config/server");
    vi.mocked(isOpenAIConfigured).mockReturnValue(true);
    const { getProject } = await import("@/lib/domain/projects/project.service");
    vi.mocked(getProject).mockResolvedValue({
      data: { id: "p1", name: "Project" },
      error: null,
    });
  });

  it("returns 404 when thread_id is not found for tenant/project (RLS-filtered)", async () => {
    const { createClientFromRequest } = await import("@/lib/supabase/server");
    vi.mocked(createClientFromRequest).mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === "ai_chat_threads") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    } as never);

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: "foreign-thread-id",
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(404);
    const j = (await res.json()) as { error?: string };
    expect(j.error).toContain("Thread not found");
  });

  it("returns 403 when project is outside tenant rights", async () => {
    const { getProject } = await import("@/lib/domain/projects/project.service");
    vi.mocked(getProject).mockResolvedValueOnce({ data: null, error: "Insufficient rights" });

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 when user_text is missing or blank", async () => {
    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 503 when service role admin client is unavailable", async () => {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(getAdminClient).mockReturnValueOnce(null);

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(503);
    const j = (await res.json()) as { code?: string };
    expect(j.code).toBe("ai_admin_unavailable");
  });

  it("returns 402 when copilot LLM gate denies (quota)", async () => {
    const { gateCopilotLlmRequest } = await import("@/lib/copilot/copilot-ai-gate");
    vi.mocked(gateCopilotLlmRequest).mockResolvedValueOnce({
      ok: false,
      httpStatus: 402,
      message: "AI budget exceeded",
      code: "ai_budget_exceeded",
    });

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(402);
  });

  it("returns 503 when OpenAI is not configured", async () => {
    const { isOpenAIConfigured } = await import("@/lib/config/server");
    vi.mocked(isOpenAIConfigured).mockReturnValue(false);

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(503);
    expect(res.headers.get("X-Stream-Status")).toBe("unavailable");
  });

  it("returns 200 with stream and SSE headers when body valid", async () => {
    const { recordUsage } = await import("@/lib/platform/ai-usage/ai-usage.service");
    global.fetch = vi.fn().mockImplementation(() => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"!"}}]}\n\n'));
          controller.enqueue(
            encoder.encode(
              'data: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":5,"total_tokens":25}}\n\n'
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return Promise.resolve({
        ok: true,
        body: stream,
        status: 200,
      } as Response);
    });

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Hello",
        decision_context: {
          overall_risk: 0,
          confidence: 0,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.body).toBeInstanceOf(ReadableStream);
    await res.text();
    expect(vi.mocked(recordUsage)).toHaveBeenCalled();
  });

  it("falls back to deterministic done event when provider returns non-OK", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("provider down"),
    } as unknown as Response);

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Need next action",
        decision_context: {
          overall_risk: 0.6,
          confidence: 0.8,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: null,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("event: done");
    expect(body).toContain("fallback_reason");
    expect(body).toContain("provider_unavailable");
  });

  it("injects locale hint into system prompt when locale is provided", async () => {
    let capturedPayload: Record<string, unknown> | null = null;
    global.fetch = vi.fn().mockImplementation(async (_url, init?: RequestInit) => {
      capturedPayload = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return {
        ok: false,
        status: 503,
        text: vi.fn().mockResolvedValue("provider down"),
      } as unknown as Response;
    });

    const req = new Request("https://x/api/v1/projects/p1/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: null,
        user_text: "Privet",
        decision_context: {
          overall_risk: 0.4,
          confidence: 0.8,
          top_risk_factors: [],
          projected_delay_date: null,
          velocity_trend: "unknown",
          anomalies: [],
          aggregated_at: new Date().toISOString(),
        },
        locale: "ru",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const messages = (capturedPayload?.messages as Array<{ role?: string; content?: string }>) ?? [];
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    expect(system).toContain("User interface language: ru");
  });
});
