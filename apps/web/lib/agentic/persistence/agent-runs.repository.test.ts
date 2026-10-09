import { describe, expect, it } from "vitest";
import { findRunByIdempotency, persistAgentRun, redactSensitiveText } from "./agent-runs.repository";
import type { AgentExecutionContext } from "../types";

function ctx(over: Partial<AgentExecutionContext> = {}): AgentExecutionContext {
  return {
    tenantId: "tenant-1",
    projectId: "project-a",
    userId: "user-a",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles: ["manager"],
    permissions: [],
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: new Date().toISOString(),
    ...over,
  };
}

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const k of ["select", "eq", "in", "lt", "order", "limit"]) api[k] = self;
  api.maybeSingle = async () => result;
  return api;
}

describe("agent run persistence", () => {
  it("binds actor_user_id from trusted context, not a client-supplied victim id", async () => {
    const inserted: unknown[] = [];
    const supabase = {
      from: (table: string) => {
        if (table === "agent_runs") {
          return {
            insert: (row: unknown) => {
              inserted.push(row);
              return Promise.resolve({ error: null });
            },
          };
        }
        return { insert: async () => ({ error: null }) };
      },
    };
    await persistAgentRun(supabase as never, {
      runId: "run-1",
      context: ctx({ userId: "user-a" }),
      status: "COMPLETED",
      request: { message: "password=hunter2 https://x.example/file?token=abc" },
      skillsCalled: [],
      structuredResult: { runId: "run-1", answer: "ok" },
      latencyMs: 1,
      steps: [],
      proposed: [],
    });
    expect(inserted[0]).toMatchObject({ actor_user_id: "user-a" });
    expect(inserted[0]).not.toMatchObject({ actor_user_id: "user-b" });
    expect((inserted[0] as { request: { message: string } }).request.message).not.toContain("hunter2");
    expect((inserted[0] as { request: { message: string } }).request.message).toContain("[redacted");
  });

  it("does not replay a run from another project even if the row leaks", async () => {
    const supabase = {
      from: () =>
        chain({
          data: {
            id: "run-a",
            tenant_id: "tenant-1",
            project_id: "project-a",
            actor_user_id: "user-a",
            structured_result: { runId: "run-a", answer: "secret-a" },
            status: "COMPLETED",
          },
          error: null,
        }),
    };
    const found = await findRunByIdempotency(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-b",
      userId: "user-a",
      idempotencyKey: "abc",
    });
    expect(found).toBeNull();
  });

  it("does not replay another actor's run", async () => {
    const supabase = {
      from: () =>
        chain({
          data: {
            id: "run-b",
            tenant_id: "tenant-1",
            project_id: "project-a",
            actor_user_id: "user-b",
            structured_result: { runId: "run-b", answer: "victim" },
            status: "COMPLETED",
          },
          error: null,
        }),
    };
    const found = await findRunByIdempotency(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-a",
      userId: "user-a",
      idempotencyKey: "abc",
    });
    expect(found).toBeNull();
  });
});

describe("redactSensitiveText", () => {
  it("redacts secrets and signed URLs from persisted prompt text", () => {
    expect(redactSensitiveText("password=hunter2 and sk-abcdefghijklmnopqrstuvwxyz")).toContain("[redacted");
    expect(redactSensitiveText("https://x.example/file?token=abc")).toBe("[redacted-url]");
    expect(redactSensitiveText("hello world")).toBe("hello world");
  });
});
