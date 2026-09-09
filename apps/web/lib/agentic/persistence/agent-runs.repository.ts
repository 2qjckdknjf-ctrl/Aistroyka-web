/**
 * Persist agent runs, steps, and proposed actions. No secrets or signed URLs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { IDEMPOTENCY_TTL_HOURS } from "@/lib/platform/idempotency/idempotency.types";
import { AgentError } from "../errors";
import type { AgentExecutionContext, AgentRunStatus, SkillRiskLevel } from "../types";
import type { AgentEvidence } from "../contracts/evidence.types";
import type { ProposedAgentAction } from "../envelope/action-envelope";
import { logAgentMetric } from "../observability/metrics";

export interface PersistRunInput {
  runId: string;
  context: AgentExecutionContext;
  status: AgentRunStatus;
  request: Record<string, unknown>;
  skillsCalled: string[];
  structuredResult: unknown;
  modelProvider?: string | null;
  modelName?: string | null;
  promptVersion?: string;
  tokenUsage?: { promptTokens: number; completionTokens: number } | null;
  latencyMs: number;
  errorCode?: string | null;
  idempotencyKey?: string | null;
  steps: Array<{
    skill: string;
    input: unknown;
    output: unknown;
    status: "COMPLETED" | "FAILED" | "DENIED" | "SKIPPED";
    durationMs: number;
    evidence: AgentEvidence[];
    errorCode?: string;
  }>;
  proposed: Array<ProposedAgentAction & { riskLevel: SkillRiskLevel }>;
}

/**
 * Slice-01 persistence is fail-closed: the API must never return an auditable runId
 * when its parent/steps/proposed actions could not be stored. The governance child
 * slice strengthens this further with staged finalization and versioned evidence.
 */
export async function persistAgentRun(supabase: SupabaseClient, input: PersistRunInput): Promise<void> {
  const { error } = await supabase.from("agent_runs").insert({
    id: input.runId,
    tenant_id: input.context.tenantId,
    project_id: input.context.projectId,
    actor_user_id: input.context.userId,
    agent_type: "project_delivery",
    request: redactAgentRequest(input.request),
    status: input.status,
    model_provider: input.modelProvider ?? null,
    model_name: input.modelName ?? null,
    prompt_version: input.promptVersion ?? null,
    skills_called: input.skillsCalled,
    structured_result: input.structuredResult,
    token_usage: input.tokenUsage ?? null,
    latency_ms: input.latencyMs,
    started_at: input.context.timestamp,
    completed_at: new Date().toISOString(),
    trace_id: input.context.traceId,
    error_code: input.errorCode ?? null,
    idempotency_key: input.idempotencyKey ?? null,
  });
  if (error) {
    logAgentMetric("agentic.persist_failed", { table: "agent_runs" });
    throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "agent_run_persist_failed", 503);
  }

  if (input.steps.length > 0) {
    const { error: stepsError } = await supabase.from("agent_run_steps").insert(
      input.steps.map((s) => ({
        tenant_id: input.context.tenantId,
        project_id: input.context.projectId,
        agent_run_id: input.runId,
        skill: s.skill,
        input: s.input,
        output: s.output,
        status: s.status,
        duration_ms: s.durationMs,
        evidence_refs: s.evidence.map((e) => ({
          evidenceId: e.evidenceId,
          type: e.type,
          sourceEntityType: e.sourceEntityType,
          sourceEntityId: e.sourceEntityId,
        })),
        error_code: s.errorCode ?? null,
      }))
    );
    if (stepsError) {
      logAgentMetric("agentic.persist_failed", { table: "agent_run_steps" });
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "agent_run_steps_persist_failed", 503);
    }
  }

  if (input.proposed.length > 0) {
    const { error: proposedError } = await supabase.from("proposed_agent_actions").insert(
      input.proposed.map((p) => ({
        tenant_id: input.context.tenantId,
        project_id: input.context.projectId,
        agent_run_id: input.runId,
        skill_name: p.skillName,
        action_type: p.actionType,
        risk_level: p.riskLevel,
        payload: p.payload,
        reason: p.reason,
        expected_effect: p.expectedEffect,
        approval_required: p.approvalRequired,
        status: "PROPOSED",
        created_by: input.context.userId,
      }))
    );
    if (proposedError) {
      logAgentMetric("agentic.persist_failed", { table: "proposed_agent_actions" });
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "proposed_agent_actions_persist_failed", 503);
    }
  }
}

export async function findRunByIdempotency(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    projectId: string;
    userId: string;
    idempotencyKey: string;
    now?: Date;
  }
): Promise<{ id: string; structured_result: unknown; status: string } | null> {
  const now = input.now ?? new Date();
  const cutoff = new Date(now.getTime() - IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, tenant_id, project_id, actor_user_id, structured_result, status, created_at")
    .eq("tenant_id", input.tenantId)
    .eq("project_id", input.projectId)
    .eq("actor_user_id", input.userId)
    .eq("idempotency_key", input.idempotencyKey)
    .gte("created_at", cutoff)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    tenant_id: string;
    project_id: string;
    actor_user_id: string | null;
    structured_result: unknown;
    status: string;
    created_at: string | null;
  };
  if (row.tenant_id !== input.tenantId) return null;
  if (row.project_id !== input.projectId) return null;
  if (row.actor_user_id !== input.userId) return null;
  if (!row.created_at) return null;
  const createdAt = Date.parse(row.created_at);
  if (!Number.isFinite(createdAt) || createdAt < Date.parse(cutoff) || createdAt > now.getTime()) return null;
  return { id: row.id, structured_result: row.structured_result, status: row.status };
}

export function redactAgentRequest(request: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request)) {
    const lower = k.toLowerCase();
    if (lower.includes("token") || lower.includes("secret") || lower.includes("password")) continue;
    if (typeof v === "string") {
      out[k] = redactSensitiveText(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function redactSensitiveText(value: string): string {
  const clipped = value.length > 500 ? value.slice(0, 500) : value;
  return clipped
    .replace(/https?:\/\/[^\s]+/gi, (url) =>
      /([?&](token|sig|signature|access_token|X-Amz-Signature)=)/i.test(url) ? "[redacted-url]" : url
    )
    .replace(/\b(sk-|rk-|xox[baprs]-)[A-Za-z0-9_-]{10,}/g, "[redacted-secret]")
    .replace(/\b(api[_-]?key|password|secret|bearer)\s*[:=]\s*\S+/gi, "[redacted-credential]");
}
