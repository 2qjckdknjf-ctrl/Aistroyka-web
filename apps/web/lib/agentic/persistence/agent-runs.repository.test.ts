import { describe, expect, it } from "vitest";
import {
  findRunByIdempotency,
  persistAgentRun,
  redactSensitiveText,
  sanitizeGovernanceEvidencePack,
} from "./agent-runs.repository";
import { AgentError } from "../errors";
import type { AgentExecutionContext } from "../types";
import type { AgentExecutionEvidencePack } from "../contracts/execution-evidence-pack";
import { EXECUTION_EVIDENCE_PACK_VERSION } from "../contracts/execution-evidence-pack";
import { RUNTIME_AUTHZ_POLICY_VERSION } from "../security/runtime-authorization";

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

function mutationChain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  api.eq = () => api;
  api.select = () => api;
  api.maybeSingle = async () => result;
  return api;
}

function successfulMutation() {
  return mutationChain({ data: { id: "run-1" }, error: null });
}

function governancePack(): AgentExecutionEvidencePack {
  return {
    schemaVersion: EXECUTION_EVIDENCE_PACK_VERSION,
    executionId: "trace-1:inspect_project:1",
    requestId: "request-1",
    traceId: "trace-1",
    tenantId: "tenant-1",
    projectId: "project-a",
    userId: "user-a",
    skill: {
      id: "inspect_project",
      name: "inspect_project",
      version: "1",
      executionMode: "READ",
      riskLevel: "LOW",
    },
    authorization: {
      status: "ALLOW",
      policyVersion: RUNTIME_AUTHZ_POLICY_VERSION,
      effectivePermissions: ["mode:read", "project:read"],
      approvalRequired: false,
      approvalId: null,
      approvalApprovedBy: null,
      approvalApprovedAt: null,
      approvalConsumedAt: null,
      approvalExpiresAt: null,
      level: "LEVEL_0_READ",
      operationId: null,
      actionType: null,
      inputHash: null,
    },
    outcome: "COMPLETED",
    failureCode: null,
    evidence: [
      {
        evidenceId: "PHOTO:media-1",
        type: "PHOTO",
        sourceEntityType: "media",
        sourceEntityId: "media-1",
        sourceUrl: "https://storage.example/file?token=secret-token",
        storageObject: "private/tenant-1/signed-object",
        capturedAt: "2026-09-09T10:00:00.000Z",
        metadata: {
          signedUrl: "https://storage.example/file?X-Amz-Signature=secret",
          providerToken: "secret-provider-token",
        },
      },
    ],
    insufficientEvidence: false,
    createdAt: "2026-09-09T10:01:00.000Z",
  };
}

describe("agent run persistence", () => {
  it("binds actor_user_id from trusted context and finalizes only after children persist", async () => {
    const inserted: unknown[] = [];
    const updates: unknown[] = [];
    const supabase = {
      from: (table: string) => {
        if (table === "agent_runs") {
          return {
            insert: (row: unknown) => {
              inserted.push(row);
              return Promise.resolve({ error: null });
            },
            update: (patch: unknown) => {
              updates.push(patch);
              return successfulMutation();
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

    expect(inserted[0]).toMatchObject({ actor_user_id: "user-a", status: "EXECUTING", structured_result: null });
    expect(inserted[0]).not.toMatchObject({ actor_user_id: "user-b" });
    expect((inserted[0] as { request: { message: string } }).request.message).not.toContain("hunter2");
    expect((inserted[0] as { request: { message: string } }).request.message).toContain("[redacted");
    expect(updates).toContainEqual(
      expect.objectContaining({ status: "COMPLETED", structured_result: { runId: "run-1", answer: "ok" } })
    );
  });

  it("persists a sanitized but re-validatable governance pack", async () => {
    const stepRows: unknown[] = [];
    const supabase = {
      from: (table: string) => {
        if (table === "agent_runs") {
          return {
            insert: async () => ({ error: null }),
            update: () => successfulMutation(),
          };
        }
        if (table === "agent_run_steps") {
          return {
            insert: async (rows: unknown) => {
              stepRows.push(rows);
              return { error: null };
            },
          };
        }
        return { insert: async () => ({ error: null }) };
      },
    };

    await persistAgentRun(supabase as never, {
      runId: "run-1",
      context: ctx(),
      status: "COMPLETED",
      request: { message: "inspect" },
      skillsCalled: ["inspect_project"],
      structuredResult: { answer: "ok" },
      latencyMs: 1,
      proposed: [],
      steps: [
        {
          skill: "inspect_project",
          input: {},
          output: { ok: true },
          status: "COMPLETED",
          durationMs: 1,
          evidence: governancePack().evidence,
          governanceEvidence: governancePack(),
        },
      ],
    });

    const inserted = (stepRows[0] as Array<Record<string, unknown>>)[0]!;
    const persisted = inserted.governance_evidence as AgentExecutionEvidencePack;
    expect(persisted.schemaVersion).toBe(EXECUTION_EVIDENCE_PACK_VERSION);
    expect(persisted.authorization.policyVersion).toBe(RUNTIME_AUTHZ_POLICY_VERSION);
    expect(persisted.authorization.actionType).toBeNull();
    expect(persisted.failureCode).toBeNull();
    expect(persisted.evidence[0]).toMatchObject({
      evidenceId: "PHOTO:media-1",
      type: "PHOTO",
      sourceEntityId: "media-1",
      sourceUrl: null,
      storageObject: null,
      metadata: {},
    });
    expect(JSON.stringify(persisted)).not.toContain("secret-token");
    expect(JSON.stringify(persisted)).not.toContain("signed-object");
    expect(JSON.stringify(persisted)).not.toContain("secret-provider-token");
  });

  it("marks the parent failed and throws when governed step persistence fails", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const supabase = {
      from: (table: string) => {
        if (table === "agent_runs") {
          return {
            insert: async () => ({ error: null }),
            update: (patch: Record<string, unknown>) => {
              updates.push(patch);
              return successfulMutation();
            },
          };
        }
        if (table === "agent_run_steps") {
          return { insert: async () => ({ error: { message: "column unavailable" } }) };
        }
        return { insert: async () => ({ error: null }) };
      },
    };

    await expect(
      persistAgentRun(supabase as never, {
        runId: "run-1",
        context: ctx(),
        status: "COMPLETED",
        request: { message: "inspect" },
        skillsCalled: ["inspect_project"],
        structuredResult: { answer: "must-not-finalize" },
        latencyMs: 1,
        proposed: [],
        steps: [
          {
            skill: "inspect_project",
            input: {},
            output: { ok: true },
            status: "COMPLETED",
            durationMs: 1,
            evidence: [],
            governanceEvidence: governancePack(),
          },
        ],
      })
    ).rejects.toMatchObject({
      code: "AGENT_GOVERNANCE_UNAVAILABLE",
      message: "agent_run_steps_persist_failed",
    });

    expect(updates).toEqual([
      expect.objectContaining({
        status: "FAILED",
        structured_result: null,
        error_code: "AGENT_GOVERNANCE_STEP_PERSIST_FAILED",
      }),
    ]);
  });

  it("throws when finalization matches zero parent rows", async () => {
    let updateCount = 0;
    const supabase = {
      from: (table: string) => {
        if (table !== "agent_runs") return { insert: async () => ({ error: null }) };
        return {
          insert: async () => ({ error: null }),
          update: () => {
            updateCount += 1;
            return mutationChain({ data: null, error: null });
          },
        };
      },
    };

    await expect(
      persistAgentRun(supabase as never, {
        runId: "run-1",
        context: ctx(),
        status: "COMPLETED",
        request: { message: "inspect" },
        skillsCalled: [],
        structuredResult: { answer: "must-not-return" },
        latencyMs: 1,
        proposed: [],
        steps: [],
      })
    ).rejects.toMatchObject({
      code: "AGENT_GOVERNANCE_UNAVAILABLE",
      message: "agent_run_finalize_failed",
    });
    expect(updateCount).toBe(2); // finalization + best-effort failure marker
  });

  it("throws instead of presenting success when the parent run cannot be persisted", async () => {
    const supabase = {
      from: () => ({ insert: async () => ({ error: { message: "db unavailable" } }) }),
    };

    await expect(
      persistAgentRun(supabase as never, {
        runId: "run-1",
        context: ctx(),
        status: "COMPLETED",
        request: { message: "inspect" },
        skillsCalled: [],
        structuredResult: { answer: "must-not-return" },
        latencyMs: 1,
        proposed: [],
        steps: [],
      })
    ).rejects.toBeInstanceOf(AgentError);
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

describe("governance evidence sanitization", () => {
  it("strips locators and arbitrary metadata without mutating the source pack", () => {
    const source = governancePack();
    const sanitized = sanitizeGovernanceEvidencePack(source);

    expect(sanitized).not.toBe(source);
    expect(sanitized.evidence[0]?.sourceUrl).toBeNull();
    expect(sanitized.evidence[0]?.storageObject).toBeNull();
    expect(sanitized.evidence[0]?.metadata).toEqual({});
    expect(source.evidence[0]?.sourceUrl).toContain("token=secret-token");
  });
});

describe("redactSensitiveText", () => {
  it("redacts secrets and signed URLs from persisted prompt text", () => {
    expect(redactSensitiveText("password=hunter2 and sk-abcdefghijklmnopqrstuvwxyz")).toContain("[redacted");
    expect(redactSensitiveText("https://x.example/file?token=abc")).toBe("[redacted-url]");
    expect(redactSensitiveText("hello world")).toBe("hello world");
  });
});
