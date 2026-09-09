import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentError } from "../errors";
import type { AgentExecutionContext } from "../types";
import type { SkillDefinition, SkillResult } from "../skills/skill.types";
import { resolveRunStatus, runProjectAgent } from "./orchestrator";

const executeRegisteredSkill = vi.fn();
const persistAgentRun = vi.fn().mockResolvedValue(undefined);
const findRunByIdempotency = vi.fn().mockResolvedValue(null);
const auditAgentRun = vi.fn().mockResolvedValue(undefined);
const bindSourceEntity = vi.fn().mockResolvedValue(null);
const synthesizeAgentAnswer = vi.fn();

vi.mock("../skills/skill-registry", () => ({
  createSkillRegistry: () => ({
    allowedReadSkills: () => ["get_overdue_tasks", "calculate_project_health", "find_project_blockers"],
    get: (name: string) => ({
      definition: {
        name,
        executionMode: "READ",
        riskLevel: "LOW",
        requiresApproval: false,
      } as SkillDefinition,
    }),
  }),
  executeRegisteredSkill: (...args: unknown[]) => executeRegisteredSkill(...args),
}));

vi.mock("../persistence/agent-runs.repository", () => ({
  persistAgentRun: (...args: unknown[]) => persistAgentRun(...args),
  findRunByIdempotency: (...args: unknown[]) => findRunByIdempotency(...args),
}));

vi.mock("../persistence/audit", () => ({
  auditAgentRun: (...args: unknown[]) => auditAgentRun(...args),
}));

vi.mock("../graph/graph.repository", () => ({
  bindSourceEntity: (...args: unknown[]) => bindSourceEntity(...args),
}));

vi.mock("./synthesis", () => ({
  synthesizeAgentAnswer: (...args: unknown[]) => synthesizeAgentAnswer(...args),
}));

function ctx(): AgentExecutionContext {
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
  };
}

function okResult(
  output: unknown,
  packInsufficient = false
): {
  definition: SkillDefinition;
  result: SkillResult;
  evidencePack: { insufficientEvidence: boolean; outcome: "COMPLETED" | "INSUFFICIENT_EVIDENCE" };
} {
  return {
    definition: { name: "x" } as SkillDefinition,
    result: { output, evidence: [], insufficientEvidence: false },
    evidencePack: {
      insufficientEvidence: packInsufficient,
      outcome: packInsufficient ? "INSUFFICIENT_EVIDENCE" : "COMPLETED",
    },
  };
}

describe("runProjectAgent", () => {
  const persistClient = { from: vi.fn() } as never;
  const recordUsage = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    executeRegisteredSkill.mockReset();
    persistAgentRun.mockClear();
    findRunByIdempotency.mockResolvedValue(null);
    recordUsage.mockClear();
    synthesizeAgentAnswer.mockClear();
    synthesizeAgentAnswer.mockResolvedValue({
      response: {
        summary: "Looks healthy",
        health: { score: 90, band: "GREEN" },
        risks: [],
        blockers: [],
        observations: [],
        proposedActions: [],
        limitations: [],
        confidence: "high",
      },
      source: "llm",
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "v1",
      latencyMs: 12,
      tokenUsage: { promptTokens: 20, completionTokens: 8 },
      providerUnavailable: false,
    });
  });

  it("does not treat a required overdue query failure as 0 overdue COMPLETED", async () => {
    executeRegisteredSkill.mockImplementation(async (_r: unknown, _c: unknown, skill: string) => {
      if (skill === "get_overdue_tasks") {
        throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_overdue_tasks", 503);
      }
      return okResult({ ok: true });
    });
    const result = await runProjectAgent({} as never, ctx(), { message: "overdue tasks" }, { persistClient, recordUsage });
    expect(result.runStatus).toBe("COMPLETED_WITH_LIMITATIONS");
    expect(result.limitations.some((l) => l.includes("get_overdue_tasks"))).toBe(true);
    expect(result.confidence).toBe("low");
    expect(synthesizeAgentAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        failedRequiredSkills: expect.arrayContaining(["get_overdue_tasks"]),
      })
    );
  });

  it("propagates Evidence Pack insufficient outcome even when the raw skill result forgot the flag", async () => {
    executeRegisteredSkill.mockResolvedValue(okResult({ ok: true }, true));

    const result = await runProjectAgent(
      {} as never,
      ctx(),
      { message: "overdue tasks" },
      { persistClient, recordUsage }
    );

    expect(result.runStatus).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.confidence).toBe("low");
    expect(result.limitations).toContain("INSUFFICIENT_EVIDENCE");
    expect(synthesizeAgentAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        structuredContext: expect.objectContaining({ insufficientEvidence: true }),
      })
    );
    expect(persistAgentRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "INSUFFICIENT_EVIDENCE" })
    );
  });

  it("records usage once for a real provider call and not on replay", async () => {
    executeRegisteredSkill.mockResolvedValue(okResult({ ok: true }));
    await runProjectAgent({} as never, ctx(), { message: "hello" }, { persistClient, recordUsage });
    expect(recordUsage).toHaveBeenCalledTimes(1);

    recordUsage.mockClear();
    findRunByIdempotency.mockResolvedValueOnce({
      id: "run-cached",
      status: "COMPLETED",
      structured_result: {
        schemaVersion: 1,
        runId: "run-cached",
        answer: "cached",
        health: { score: 50, band: "AMBER" },
        risks: [],
        blockers: [],
        evidence: [],
        proposedActions: [],
        limitations: [],
        runStatus: "COMPLETED",
        synthesisSource: "llm",
      },
    });
    await runProjectAgent({} as never, ctx(), { message: "hello", idempotencyKey: "abc" }, { persistClient, recordUsage });
    expect(recordUsage).not.toHaveBeenCalled();
    expect(synthesizeAgentAnswer).toHaveBeenCalledTimes(1);
  });

  it("replays the original evidence timestamp instead of using replay wall-clock time", async () => {
    findRunByIdempotency.mockResolvedValueOnce({
      id: "run-evidence",
      status: "COMPLETED",
      structured_result: {
        schemaVersion: 1,
        runId: "run-evidence",
        answer: "cached",
        risks: [],
        blockers: [],
        evidence: [
          {
            evidenceId: "PHOTO:media-1",
            type: "PHOTO",
            sourceEntityType: "media",
            sourceEntityId: "media-1",
            capturedAt: "2026-09-09T08:30:00.000Z",
          },
        ],
        proposedActions: [],
        limitations: [],
        runStatus: "COMPLETED",
        synthesisSource: "llm",
      },
    });

    const replay = await runProjectAgent(
      {} as never,
      ctx(),
      { message: "hello", idempotencyKey: "evidence" },
      { persistClient, recordUsage }
    );

    expect(replay.evidence).toHaveLength(1);
    expect(replay.evidence[0]?.capturedAt).toBe("2026-09-09T08:30:00.000Z");
    expect(replay.limitations).not.toContain("IDEMPOTENCY_REPLAY_EVIDENCE_TIMESTAMP_UNAVAILABLE");
    expect(executeRegisteredSkill).not.toHaveBeenCalled();
  });

  it("drops legacy replay evidence without a timestamp rather than fabricating one", async () => {
    findRunByIdempotency.mockResolvedValueOnce({
      id: "run-legacy",
      status: "COMPLETED",
      structured_result: {
        schemaVersion: 1,
        runId: "run-legacy",
        answer: "cached legacy",
        risks: [],
        blockers: [],
        evidence: [
          {
            evidenceId: "DATABASE_STATE:legacy",
            type: "DATABASE_STATE",
            sourceEntityType: "projects",
            sourceEntityId: "project-a",
          },
        ],
        proposedActions: [],
        limitations: [],
        runStatus: "COMPLETED",
        synthesisSource: "llm",
      },
    });

    const replay = await runProjectAgent(
      {} as never,
      ctx(),
      { message: "hello", idempotencyKey: "legacy" },
      { persistClient, recordUsage }
    );

    expect(replay.evidence).toEqual([]);
    expect(replay.limitations).toContain("IDEMPOTENCY_REPLAY_EVIDENCE_TIMESTAMP_UNAVAILABLE");
    expect(executeRegisteredSkill).not.toHaveBeenCalled();
  });

  it("does not record usage for deterministic fallback without a provider call", async () => {
    executeRegisteredSkill.mockResolvedValue(okResult({ ok: true }));
    synthesizeAgentAnswer.mockResolvedValueOnce({
      response: {
        summary: "fallback",
        risks: [],
        blockers: [],
        observations: [],
        proposedActions: [],
        limitations: ["AGENT_PROVIDER_UNAVAILABLE"],
        confidence: "medium",
      },
      source: "deterministic",
      promptVersion: "v1",
      latencyMs: 1,
      providerUnavailable: true,
    });
    await runProjectAgent({} as never, ctx(), { message: "hello" }, { persistClient, recordUsage });
    expect(recordUsage).not.toHaveBeenCalled();
  });

  it("misses malformed persisted replay instead of trusting it", async () => {
    findRunByIdempotency.mockResolvedValueOnce({
      id: "run-bad",
      status: "COMPLETED",
      structured_result: { health: "I invented this" },
    });
    executeRegisteredSkill.mockResolvedValue(okResult({ ok: true }));
    await runProjectAgent({} as never, ctx(), { message: "hello", idempotencyKey: "abc" }, { persistClient, recordUsage });
    expect(executeRegisteredSkill).toHaveBeenCalled();
  });
});

describe("resolveRunStatus", () => {
  it("fails the run when every required skill fails", () => {
    expect(resolveRunStatus({ failedRequiredCount: 3, plannedRequiredCount: 3, insufficient: true })).toBe("FAILED");
  });

  it("marks limitations when some required skills fail", () => {
    expect(resolveRunStatus({ failedRequiredCount: 1, plannedRequiredCount: 3, insufficient: true })).toBe(
      "COMPLETED_WITH_LIMITATIONS"
    );
  });
});
