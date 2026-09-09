/**
 * Persist agent runs, steps, and proposed actions. No secrets or signed URLs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentError } from "../errors";
import type { AgentExecutionContext, AgentRunStatus, SkillRiskLevel } from "../types";
import type { AgentEvidence } from "../contracts/evidence.types";
import type { AgentExecutionEvidencePack } from "../contracts/execution-evidence-pack";
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
    governanceEvidence?: AgentExecutionEvidencePack | null;
    errorCode?: string;
  }>;
  proposed: Array<ProposedAgentAction & { riskLevel: SkillRiskLevel }>;
}

/**
 * Persistence is staged fail-closed: the parent row starts as EXECUTING and is only
 * finalized to the caller-visible terminal status after governed steps and proposed
 * actions are durably stored. Any child/finalization error is propagated, preventing
 * the orchestrator from auditing or returning a successful run without its evidence.
 */
export async function persistAgentRun(supabase: SupabaseClient, input: PersistRunInput): Promise<void> {
  const { error } = await supabase.from("agent_runs").insert({
    id: input.runId,
    tenant_id: input.context.tenantId,
    project_id: input.context.projectId,
    actor_user_id: input.context.userId,
    agent_type: "project_delivery",
    request: redactAgentRequest(input.request),
    status: "EXECUTING",
    model_provider: input.modelProvider ?? null,
    model_name: input.modelName ?? null,
    prompt_version: input.promptVersion ?? null,
    skills_called: input.skillsCalled,
    structured_result: null,
    token_usage: input.tokenUsage ?? null,
    latency_ms: input.latencyMs,
    started_at: input.context.timestamp,
    completed_at: null,
    trace_id: input.context.traceId,
    error_code: null,
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
        evidence_refs: buildPersistedEvidenceRefs(s.evidence),
        governance_evidence: s.governanceEvidence
          ? sanitizeGovernanceEvidencePack(s.governanceEvidence)
          : null,
        error_code: s.errorCode ?? null,
      }))
    );
    if (stepsError) {
      logAgentMetric("agentic.persist_failed", { table: "agent_run_steps" });
      await markRunPersistenceFailed(supabase, input, "AGENT_GOVERNANCE_STEP_PERSIST_FAILED");
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
      await markRunPersistenceFailed(supabase, input, "AGENT_PROPOSED_ACTION_PERSIST_FAILED");
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "proposed_agent_actions_persist_failed", 503);
    }
  }

  const { error: finalizeError } = await scopedRunUpdate(supabase, input, {
    status: input.status,
    structured_result: input.structuredResult,
    completed_at: new Date().toISOString(),
    error_code: input.errorCode ?? null,
  });
  if (finalizeError) {
    logAgentMetric("agentic.persist_failed", { table: "agent_runs_finalize" });
    await markRunPersistenceFailed(supabase, input, "AGENT_RUN_FINALIZE_FAILED");
    throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "agent_run_finalize_failed", 503);
  }
}

async function markRunPersistenceFailed(
  supabase: SupabaseClient,
  input: Pick<PersistRunInput, "runId" | "context">,
  errorCode: string
): Promise<void> {
  const { error } = await scopedRunUpdate(supabase, input, {
    status: "FAILED",
    structured_result: null,
    completed_at: new Date().toISOString(),
    error_code: errorCode,
  });
  if (error) {
    logAgentMetric("agentic.persist_failed", { table: "agent_runs_failure_marker" });
  }
}

/**
 * PostgREST can report a successful UPDATE that matched zero rows. Request the row
 * representation and require the exact scoped run ID so a deleted/mismatched parent
 * can never be mistaken for a durable finalization.
 */
async function scopedRunUpdate(
  supabase: SupabaseClient,
  input: Pick<PersistRunInput, "runId" | "context">,
  patch: Record<string, unknown>
): Promise<{ error: unknown }> {
  const result = await supabase
    .from("agent_runs")
    .update(patch)
    .eq("id", input.runId)
    .eq("tenant_id", input.context.tenantId)
    .eq("project_id", input.context.projectId)
    .select("id")
    .maybeSingle();
  const row = result.data as { id?: string } | null;
  if (result.error) return { error: result.error };
  if (row?.id !== input.runId) {
    return { error: { message: "agent_run_update_cardinality_mismatch" } };
  }
  return { error: null };
}

function buildPersistedEvidenceRefs(evidence: AgentEvidence[]): Array<Record<string, unknown>> {
  return evidence.map((e) => ({
    evidenceId: e.evidenceId,
    type: e.type,
    sourceEntityType: e.sourceEntityType,
    sourceEntityId: e.sourceEntityId,
  }));
}

/**
 * Governance evidence is persisted as a re-validatable pack, but evidence locators
 * and arbitrary metadata are intentionally stripped. Those fields may contain
 * signed URLs, storage paths, provider data, or secrets and are not required by
 * `validateAgentExecutionEvidencePack`.
 */
export function sanitizeGovernanceEvidencePack(
  pack: AgentExecutionEvidencePack
): AgentExecutionEvidencePack {
  return {
    ...pack,
    authorization: {
      ...pack.authorization,
      effectivePermissions: [...pack.authorization.effectivePermissions],
    },
    evidence: pack.evidence.map((e) => ({
      evidenceId: e.evidenceId,
      type: e.type,
      sourceEntityType: e.sourceEntityType,
      sourceEntityId: e.sourceEntityId,
      sourceUrl: null,
      storageObject: null,
      capturedAt: e.capturedAt,
      metadata: {},
    })),
  };
}

export async function findRunByIdempotency(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    projectId: string;
    userId: string;
    idempotencyKey: string;
  }
): Promise<{ id: string; structured_result: unknown; status: string } | null> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, tenant_id, project_id, actor_user_id, structured_result, status")
    .eq("tenant_id", input.tenantId)
    .eq("project_id", input.projectId)
    .eq("actor_user_id", input.userId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    tenant_id: string;
    project_id: string;
    actor_user_id: string | null;
    structured_result: unknown;
    status: string;
  };
  if (row.tenant_id !== input.tenantId) return null;
  if (row.project_id !== input.projectId) return null;
  if (row.actor_user_id !== input.userId) return null;
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
