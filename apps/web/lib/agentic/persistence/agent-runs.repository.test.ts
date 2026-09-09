import { describe, expect, it } from "vitest";
import { findRunByIdempotency, persistAgentRun, redactSensitiveText } from "./agent-runs.repository";
import { AgentError } from "../errors";
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
  for (const k of ["select", "eq", "in", "lt", "gte", "order", "limit"]) api[k] = self;
  api.maybeSingle = async () => result;
  return api;
}

function replayRow(createdAt: string) {
  return {
    id: "run-a",
    tenant_id: "tenant-1",
    project_id: "project-a",
    actor_user_id: "user-a",
    structured_result: { runId: "run-a", answer: "cached" },
    status: "COMPLETED",
    created_at: createdAt,
  };
}

describe("agent run persistence", () => {
  it("binds actor_user_id from trusted context and redacts prompt secrets", async () => {
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

  it("fails the request when the parent run cannot be persisted", async () => {
    const supabase = {
      from: () => ({ insert: async () => ({ error: { message: "db down" } }) }),
    };
    await expect(
      persistAgentRun(supabase as never, {
        runId: "run-1",
        context: ctx(),
        status: "COMPLETED",
        request: {},
        skillsCalled: [],
        structuredResult: { answer: "must-not-return" },
        latencyMs: 1,
        steps: [],
        proposed: [],
      })
    ).rejects.toMatchObject({
      code: "AGENT_GOVERNANCE_UNAVAILABLE",
      message: "agent_run_persist_failed",
    });
  });

  it("fails closed when step persistence fails", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "agent_runs") return { insert: async () => ({ error: null }) };
        if (table === "agent_run_steps") return { insert: async () => ({ error: { message: "step failure" } }) };
        return { insert: async () => ({ error: null }) };
      },
    };
    await expect(
      persistAgentRun(supabase as never, {
        runId: "run-1",
        context: ctx(),
        status: "COMPLETED",
        request: {},
        skillsCalled: ["get_project_state"],
        structuredResult: { answer: "must-not-return" },
        latencyMs: 1,
        steps: [
          {
            skill: "get_project_state",
            input: {},
            output: {},
            status: "COMPLETED",
            durationMs: 1,
            evidence: [],
          },
        ],
        proposed: [],
      })
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("does not replay a run from another project even if the row leaks", async () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const supabase = {
      from: () =>
        chain({
          data: { ...replayRow("2026-09-09T11:00:00.000Z"), project_id: "project-a" },
          error: null,
        }),
    };
    const found = await findRunByIdempotency(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-b",
      userId: "user-a",
      idempotencyKey: "abc",
      now,
    });
    expect(found).toBeNull();
  });

  it("does not replay another actor's run", async () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const supabase = {
      from: () =>
        chain({
          data: { ...replayRow("2026-09-09T11:00:00.000Z"), actor_user_id: "user-b" },
          error: null,
        }),
    };
    const found = await findRunByIdempotency(supabase as never, {
      tenantId: "tenant-1",
      projectId: "project-a",
      userId: "user-a",
      idempotencyKey: "abc",
      now,
    });
    expect(found).toBeNull();
  });

  it("replays only within the same 24-hour idempotency ttl", async () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const freshClient = {
      from: () => chain({ data: replayRow("2026-09-09T11:00:00.000Z"), error: null }),
    };
    const staleClient = {
      from: () => chain({ data: replayRow("2026-09-08T11:59:59.000Z"), error: null }),
    };

    await expect(
      findRunByIdempotency(freshClient as never, {
        tenantId: "tenant-1",
        projectId: "project-a",
        userId: "user-a",
        idempotencyKey: "abc",
        now,
      })
    ).resolves.toMatchObject({ id: "run-a" });

    await expect(
      findRunByIdempotency(staleClient as never, {
        tenantId: "tenant-1",
        projectId: "project-a",
        userId: "user-a",
        idempotencyKey: "abc",
        now,
      })
    ).resolves.toBeNull();
  });
});

describe("redactSensitiveText", () => {
  it("redacts secrets and signed URLs from persisted prompt text", () => {
    expect(redactSensitiveText("password=hunter2 and sk-abcdefghijklmnopqrstuvwxyz")).toContain("[redacted");
    expect(redactSensitiveText("https://x.example/file?token=abc")).toBe("[redacted-url]");
    expect(redactSensitiveText("hello world")).toBe("hello world");
  });
});
