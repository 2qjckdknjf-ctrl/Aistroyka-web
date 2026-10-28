/**
 * Agentic Foundation orchestrator.
 * LLM reasons over skill outputs; skills are the only data path; policy gates actions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError, isAgentError } from "../errors";
import type { AgentExecutionContext, AgentRunStatus } from "../types";
import { createSkillRegistry, executeRegisteredSkill } from "../skills/skill-registry";
import { isRequiredSkill, resolveAgentIntent, skillsForIntent } from "./intent";
import { synthesizeAgentAnswer } from "./synthesis";
import {
  parseAgentPublicResponse,
  sanitizeProposedActions,
  type AgentPublicResponse,
  type AgentStructuredResponse,
} from "./structured-output";
import { isRestrictedActionType } from "../policy/policy-levels";
import { resolveAgentActionPolicy } from "../policy/policy-resolver";
import { persistAgentRun, findRunByIdempotency } from "../persistence/agent-runs.repository";
import { auditAgentRun } from "../persistence/audit";
import { logAgentMetric } from "../observability/metrics";
import { bindSourceEntity } from "../graph/graph.repository";
import type { AgentEvidence } from "../contracts/evidence.types";
import type { ProposedAgentAction } from "../envelope/action-envelope";
import { buildActionEnvelope } from "../envelope/action-envelope";

const SUGGEST_SKILL_NAME = "suggest";

export interface AgentOrchestratorRequest {
  message: string;
  idempotencyKey?: string | null;
}

export interface AgentOrchestratorResponse {
  schemaVersion: 1;
  runId: string;
  answer: string;
  health: AgentStructuredResponse["health"];
  risks: AgentStructuredResponse["risks"];
  blockers: AgentStructuredResponse["blockers"];
  evidence: AgentEvidence[];
  proposedActions: ProposedAgentAction[];
  limitations: string[];
  confidence?: string;
  synthesisSource: "llm" | "deterministic";
  runStatus: AgentRunStatus;
}

export interface AgentUsageRecorder {
  (input: {
    promptTokens: number;
    completionTokens: number;
    model: string;
    provider: string;
    durationMs: number;
  }): Promise<void>;
}

export interface RunProjectAgentOptions {
  persistClient: SupabaseClient;
  recordUsage?: AgentUsageRecorder;
}

export async function runProjectAgent(
  supabase: SupabaseClient,
  context: AgentExecutionContext,
  request: AgentOrchestratorRequest,
  options: RunProjectAgentOptions
): Promise<AgentOrchestratorResponse> {
  const started = Date.now();
  const message = request.message.trim();
  if (!message) {
    throw new AgentError("AGENT_INVALID_INPUT", "message required", 400);
  }

  if (request.idempotencyKey) {
    const existing = await findRunByIdempotency(options.persistClient, {
      tenantId: context.tenantId,
      projectId: context.projectId,
      userId: context.userId,
      idempotencyKey: request.idempotencyKey,
    });
    const replayed = existing ? parseAgentPublicResponse(existing.structured_result) : null;
    if (replayed) {
      return toOrchestratorResponse(replayed);
    }
  }

  const registry = createSkillRegistry(supabase);
  const intent = resolveAgentIntent(message);
  const required = skillsForIntent(intent);
  const allowlist = registry.allowedReadSkills(context);
  const planned = required.filter((id) => allowlist.includes(id));
  const deniedRequired = required.filter((id) => !allowlist.includes(id));

  const skillOutputs: Record<string, unknown> = {};
  const evidence: AgentEvidence[] = [];
  const steps: Parameters<typeof persistAgentRun>[1]["steps"] = [];
  let insufficient = false;
  const failedRequired: string[] = [...deniedRequired];
  const failedOptional: string[] = [];

  for (const skillName of planned) {
    const skillStarted = Date.now();
    const requiredSkill = isRequiredSkill(intent, skillName);
    try {
      const { result } = await executeRegisteredSkill(registry, context, skillName, {});
      skillOutputs[skillName] = result.output;
      evidence.push(...result.evidence);
      if (result.insufficientEvidence) insufficient = true;
      steps.push({
        skill: skillName,
        input: {},
        output: result.output,
        status: "COMPLETED",
        durationMs: Date.now() - skillStarted,
        evidence: result.evidence,
      });
      logAgentMetric("agentic.skill_executed", {
        skill: skillName,
        duration_ms: Date.now() - skillStarted,
      });
    } catch (err) {
      const code = isAgentError(err) ? err.code : "AGENT_SKILL_FAILED";
      logAgentMetric("agentic.skill_failed", { skill: skillName, error_code: code });
      if (isAgentError(err) && (err.code === "AGENT_SKILL_NOT_ALLOWED" || err.code === "AGENT_POLICY_DENIED")) {
        steps.push({
          skill: skillName,
          input: {},
          output: null,
          status: "DENIED",
          durationMs: Date.now() - skillStarted,
          evidence: [],
          errorCode: err.code,
        });
        continue;
      }
      steps.push({
        skill: skillName,
        input: {},
        output: { queryFailed: true },
        status: "FAILED",
        durationMs: Date.now() - skillStarted,
        evidence: [],
        errorCode: code,
      });
      if (requiredSkill) failedRequired.push(skillName);
      else failedOptional.push(skillName);
    }
  }

  await bindCitedEntities(options.persistClient, context, evidence);

  const synthesis = await synthesizeAgentAnswer({
    locale: context.locale,
    userMessage: message,
    failedRequiredSkills: failedRequired,
    structuredContext: {
      intent,
      tenantBound: true,
      ...skillOutputs,
      insufficientEvidence: insufficient || failedRequired.length > 0,
      failedRequiredSkills: failedRequired,
      failedOptionalSkills: failedOptional,
    },
  });

  if (synthesis.tokenUsage && !synthesis.providerUnavailable && options.recordUsage) {
    await options.recordUsage({
      promptTokens: synthesis.tokenUsage.promptTokens,
      completionTokens: synthesis.tokenUsage.completionTokens,
      model: synthesis.model ?? "unknown",
      provider: synthesis.provider ?? "openai",
      durationMs: synthesis.latencyMs,
    });
  }

  const { accepted, rejected } = sanitizeProposedActions(synthesis.response.proposedActions, [
    ...allowlist,
    SUGGEST_SKILL_NAME,
  ]);

  const proposed: ProposedAgentAction[] = [];
  for (const action of accepted) {
    if (isRestrictedActionType(action.actionType)) {
      logAgentMetric("agentic.policy_denied", { action_type: action.actionType });
      continue;
    }
    const dummySkill = registry.get("get_project_state");
    if (!dummySkill) continue;
    const policy = resolveAgentActionPolicy({
      skill: {
        ...dummySkill.definition,
        executionMode: "SUGGEST",
        requiresApproval: true,
      },
      context,
      actionType: action.actionType,
    });
    if (!policy.allowed) continue;
    proposed.push({
      actionType: action.actionType,
      skillName: action.skillName,
      riskLevel: "LOW",
      payload: action.payload,
      reason: action.reason,
      expectedEffect: action.expectedEffect,
      approvalRequired: true,
    });
  }

  const limitations = [
    ...synthesis.response.limitations,
    ...rejected.map((r) => `rejected_action:${r}`),
    ...failedRequired.map((s) => `AGENT_SKILL_FAILED:${s}`),
    ...failedOptional.map((s) => `optional_skill_failed:${s}`),
  ];
  if (synthesis.providerUnavailable) {
    limitations.push("AGENT_PROVIDER_UNAVAILABLE");
  }
  if ((insufficient || failedRequired.length > 0) && evidence.length === 0) {
    limitations.push("INSUFFICIENT_EVIDENCE");
  }

  const runStatus = resolveRunStatus({
    failedRequiredCount: failedRequired.length,
    plannedRequiredCount: required.length,
    insufficient: insufficient || failedRequired.length > 0,
  });

  const confidence =
    failedRequired.length > 0 || runStatus !== "COMPLETED" ? "low" : synthesis.response.confidence;

  const runId = crypto.randomUUID();
  const response: AgentOrchestratorResponse = {
    schemaVersion: 1,
    runId,
    answer: synthesis.response.summary,
    health: failedRequired.includes("calculate_project_health") ? undefined : synthesis.response.health,
    risks: failedRequired.includes("get_project_risks") ? [] : synthesis.response.risks,
    blockers: failedRequired.includes("find_project_blockers") ? [] : synthesis.response.blockers,
    evidence: dedupeEvidence(evidence),
    proposedActions: proposed,
    limitations: [...new Set(limitations)],
    confidence,
    synthesisSource: synthesis.source,
    runStatus,
  };

  const envelopes = planned.map((skillName) => {
    const def = registry.get(skillName)?.definition;
    const step = steps.find((s) => s.skill === skillName);
    const envelopeStatus: AgentRunStatus = step?.status === "FAILED" ? "FAILED" : "COMPLETED";
    return buildActionEnvelope({
      actionId: `${runId}:${skillName}`,
      skill: skillName,
      mode: def?.executionMode ?? "READ",
      riskLevel: def?.riskLevel ?? "LOW",
      tenantId: context.tenantId,
      projectId: context.projectId,
      status: envelopeStatus,
      result: skillOutputs[skillName] ?? null,
      evidence: response.evidence.filter((e) => e.sourceEntityType && e.sourceEntityId),
      proposedActions: [],
    });
  });

  await persistAgentRun(options.persistClient, {
    runId,
    context,
    status: runStatus,
    request: { message: message.slice(0, 500), intent, envelopeCount: envelopes.length },
    skillsCalled: planned,
    structuredResult: response,
    modelProvider: synthesis.provider ?? null,
    modelName: synthesis.model ?? null,
    promptVersion: synthesis.promptVersion,
    tokenUsage: synthesis.tokenUsage ?? null,
    latencyMs: Date.now() - started,
    idempotencyKey: request.idempotencyKey ?? null,
    steps,
    proposed: proposed.map((p) => ({ ...p, riskLevel: p.riskLevel })),
  });

  await auditAgentRun(options.persistClient, {
    context,
    runId,
    skills: planned,
    status: runStatus,
    proposedCount: proposed.length,
  });

  logAgentMetric("agentic.run_completed", {
    duration_ms: Date.now() - started,
    skill_count: planned.length,
    synthesis: synthesis.source,
    run_status: runStatus,
  });

  return response;
}

export function resolveRunStatus(input: {
  failedRequiredCount: number;
  plannedRequiredCount: number;
  insufficient: boolean;
}): AgentRunStatus {
  if (input.plannedRequiredCount > 0 && input.failedRequiredCount >= input.plannedRequiredCount) {
    return "FAILED";
  }
  if (input.failedRequiredCount > 0) return "COMPLETED_WITH_LIMITATIONS";
  if (input.insufficient) return "INSUFFICIENT_EVIDENCE";
  return "COMPLETED";
}

function toOrchestratorResponse(parsed: AgentPublicResponse): AgentOrchestratorResponse {
  return {
    schemaVersion: 1,
    runId: parsed.runId,
    answer: parsed.answer,
    health: parsed.health,
    risks: parsed.risks,
    blockers: parsed.blockers,
    evidence: parsed.evidence.map((e) => ({
      evidenceId: e.evidenceId,
      type: (e.type as AgentEvidence["type"]) ?? "DATABASE_STATE",
      sourceEntityType: e.sourceEntityType ?? "unknown",
      sourceEntityId: e.sourceEntityId ?? "",
      sourceUrl: null,
      storageObject: null,
      capturedAt: new Date().toISOString(),
      metadata: {},
    })),
    proposedActions: parsed.proposedActions.map((p) => ({
      actionType: p.actionType,
      skillName: p.skillName ?? "suggest",
      riskLevel: "LOW",
      payload: p.payload ?? {},
      reason: p.reason ?? "",
      expectedEffect: p.expectedEffect ?? "",
      approvalRequired: p.approvalRequired ?? true,
    })),
    limitations: parsed.limitations,
    confidence: parsed.confidence,
    synthesisSource: parsed.synthesisSource ?? "deterministic",
    runStatus: parsed.runStatus ?? "COMPLETED",
  };
}

function dedupeEvidence(items: AgentEvidence[]): AgentEvidence[] {
  const seen = new Set<string>();
  const out: AgentEvidence[] = [];
  for (const e of items) {
    if (seen.has(e.evidenceId)) continue;
    seen.add(e.evidenceId);
    out.push(e);
  }
  return out.slice(0, 40);
}

async function bindCitedEntities(
  supabase: SupabaseClient,
  context: AgentExecutionContext,
  evidence: AgentEvidence[]
): Promise<void> {
  const sourceMap: Record<string, "TASK" | "ISSUE" | "REPORT" | "PROJECT"> = {
    worker_tasks: "TASK",
    project_defects: "ISSUE",
    project_issues: "ISSUE",
    worker_reports: "REPORT",
    projects: "PROJECT",
  };
  const tableMap: Record<
    string,
    "worker_tasks" | "project_defects" | "project_issues" | "worker_reports" | "projects"
  > = {
    worker_tasks: "worker_tasks",
    project_defects: "project_defects",
    project_issues: "project_issues",
    worker_reports: "worker_reports",
    projects: "projects",
  };
  for (const e of evidence.slice(0, 20)) {
    const entityType = sourceMap[e.sourceEntityType];
    const sourceType = tableMap[e.sourceEntityType];
    if (!entityType || !sourceType) continue;
    await bindSourceEntity(supabase, {
      tenantId: context.tenantId,
      projectId: context.projectId,
      entityType,
      sourceType,
      sourceId: e.sourceEntityId,
    });
  }
}
