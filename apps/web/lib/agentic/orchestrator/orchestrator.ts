/**
 * Agentic Foundation orchestrator.
 * LLM reasons over skill outputs; skills are the only data path; policy gates actions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError, isAgentError } from "../errors";
import type { AgentExecutionContext } from "../types";
import { createSkillRegistry, executeRegisteredSkill } from "../skills/skill-registry";
import { resolveAgentIntent, skillsForIntent } from "./intent";
import { synthesizeAgentAnswer } from "./synthesis";
import { sanitizeProposedActions, type AgentStructuredResponse } from "./structured-output";
import { isRestrictedActionType } from "../policy/policy-levels";
import { resolveAgentActionPolicy } from "../policy/policy-resolver";
import { persistAgentRun, findRunByIdempotency } from "../persistence/agent-runs.repository";
import { auditAgentRun } from "../persistence/audit";
import { logAgentMetric } from "../observability/metrics";
import { bindSourceEntity } from "../graph/graph.repository";
import type { AgentEvidence } from "../evidence/evidence.types";
import type { ProposedAgentAction } from "../envelope/action-envelope";
import { buildActionEnvelope } from "../envelope/action-envelope";

const SUGGEST_SKILL_NAME = "suggest";

export interface AgentOrchestratorRequest {
  message: string;
  idempotencyKey?: string | null;
}

export interface AgentOrchestratorResponse {
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
}

export async function runProjectAgent(
  supabase: SupabaseClient,
  context: AgentExecutionContext,
  request: AgentOrchestratorRequest
): Promise<AgentOrchestratorResponse> {
  const started = Date.now();
  const message = request.message.trim();
  if (!message) {
    throw new AgentError("AGENT_INVALID_INPUT", "message required", 400);
  }

  if (request.idempotencyKey) {
    const existing = await findRunByIdempotency(
      supabase,
      context.tenantId,
      context.userId,
      request.idempotencyKey
    );
    if (existing && existing.structured_result && typeof existing.structured_result === "object") {
      return existing.structured_result as AgentOrchestratorResponse;
    }
  }

  const registry = createSkillRegistry(supabase);
  const intent = resolveAgentIntent(message);
  const required = skillsForIntent(intent);
  const allowlist = registry.allowedReadSkills(context);
  const planned = required.filter((id) => allowlist.includes(id));

  const skillOutputs: Record<string, unknown> = {};
  const evidence: AgentEvidence[] = [];
  const steps: Parameters<typeof persistAgentRun>[1]["steps"] = [];
  let insufficient = false;

  for (const skillName of planned) {
    const skillStarted = Date.now();
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
        output: null,
        status: "FAILED",
        durationMs: Date.now() - skillStarted,
        evidence: [],
        errorCode: code,
      });
    }
  }

  await bindCitedEntities(supabase, context, evidence);

  const synthesis = await synthesizeAgentAnswer({
    locale: context.locale,
    userMessage: message,
    structuredContext: {
      intent,
      tenantBound: true,
      ...skillOutputs,
      insufficientEvidence: insufficient,
    },
  });

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
  ];
  if (synthesis.providerUnavailable) {
    limitations.push("AGENT_PROVIDER_UNAVAILABLE");
  }
  if (insufficient && evidence.length === 0) {
    limitations.push("INSUFFICIENT_EVIDENCE");
  }

  const runId = crypto.randomUUID();
  const response: AgentOrchestratorResponse = {
    runId,
    answer: synthesis.response.summary,
    health: synthesis.response.health,
    risks: synthesis.response.risks,
    blockers: synthesis.response.blockers,
    evidence: dedupeEvidence(evidence),
    proposedActions: proposed,
    limitations,
    confidence: synthesis.response.confidence,
    synthesisSource: synthesis.source,
  };

  const envelopes = planned.map((skillName) => {
    const def = registry.get(skillName)?.definition;
    return buildActionEnvelope({
      actionId: `${runId}:${skillName}`,
      skill: skillName,
      mode: def?.executionMode ?? "READ",
      riskLevel: def?.riskLevel ?? "LOW",
      tenantId: context.tenantId,
      projectId: context.projectId,
      status: "COMPLETED",
      result: skillOutputs[skillName] ?? null,
      evidence: response.evidence.filter((e) => e.sourceEntityType && e.sourceEntityId),
      proposedActions: [],
    });
  });

  await persistAgentRun(supabase, {
    runId,
    context,
    status: "COMPLETED",
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

  await auditAgentRun(supabase, {
    context,
    runId,
    skills: planned,
    status: "COMPLETED",
    proposedCount: proposed.length,
  });

  logAgentMetric("agentic.run_completed", {
    duration_ms: Date.now() - started,
    skill_count: planned.length,
    synthesis: synthesis.source,
  });

  return response;
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
  const tableMap: Record<string, "worker_tasks" | "project_defects" | "project_issues" | "worker_reports" | "projects"> = {
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
