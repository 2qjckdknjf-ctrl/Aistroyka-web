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

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn().mockReturnValue({
    OPENAI_API_KEY: "sk-test",
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
    global.fetch = vi.fn().mockImplementation(() => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"!"}}]}\n\n'));
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
});
