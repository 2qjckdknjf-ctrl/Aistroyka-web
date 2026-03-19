import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("ai-telemetry stream lifecycle events", () => {
  const logs: unknown[] = [];
  let prevNodeEnv: string | undefined;
  beforeEach(() => {
    logs.length = 0;
    prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args[0]);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (prevNodeEnv !== undefined) process.env.NODE_ENV = prevNodeEnv;
  });

  it("logCopilotStreamLifecycle emits JSON without prompt-like keys", async () => {
    const { logCopilotStreamLifecycle } = await import("./ai-telemetry");
    logCopilotStreamLifecycle("stream_started", {
      request_id: "r1",
      route: "POST /api/v1/projects/:id/copilot/chat/stream",
      tenant_id: "t1",
      project_id: "p1",
      latency_ms: 0,
      build_sha7: "abc1234",
      app_env: "staging",
    });
    expect(logs.length).toBe(1);
    const line = String(logs[0]);
    expect(line).toContain("ai_copilot_stream_started");
    expect(line).toContain("request_id");
    expect(line).not.toMatch(/user_text|prompt|messages/i);
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.event).toBe("ai_copilot_stream_started");
    expect(parsed.tenant_id).toBe("t1");
  });
});
