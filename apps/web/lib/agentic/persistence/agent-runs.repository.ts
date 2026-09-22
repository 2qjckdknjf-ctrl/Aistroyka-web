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
  now?: Date;
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
 * Persistence is staged fail-closed. A parent is not replayable as success until every
 * required child row is durable and the exact scoped parent is finalized. This is not
 * a substitute for a database transaction, but it prevents partial child persistence
 * from becoming a successful idempotency replay.
 */
export async function persistAgentRun(supabase: SupabaseClient, input: PersistRunInput): Promise<void> {
  const now = input.now ?? new Date();
  const completedAt = now.toISOString();

  if (input.idempotencyKey) {
    const cutoff = new Date(now.getTime() - IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from("agent_runs")
      .delete()
      .eq("tenant_id", input.context.tenantId)
      .eq("project_id", input.context.projectId)
      .eq("actor_user_id", input.context.userId)
      .eq("idempotency_key", input.idempotencyKey)
      .lt("created_at", cutoff);
    if (cleanupError) {
      logAgentMetric("agentic.persist_failed", { table: "agent_runs", phase: "expired_idempotency_cleanup" });
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "expired_idempotency_cleanup_failed", 503);
    }
  }

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
    logAgentMetric("agentic.persist_failed", { table: "agent_runs", phase: "parent_insert" });
    throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "agent_run_persist_failed", 503);
  }

  try {
    if (input.steps.length > 0) {
      const { error: stepsError } = await supabase.from("agent_run_steps").insert(
        input.steps.map((s) => ({
          tenant_id: input.context.tenantId,
          project_id: input.context.projectId,
          agent_run_id: input.runId,
          skill: s.skill,
          input: sanitizePersistedValue(s.input),
          output: sanitizePersistedValue(s.output),
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
          payload: sanitizePersistedValue(p.payload),
          reason: redactSensitiveText(p.reason),
          expected_effect: redactSensitiveText(p.expectedEffect),
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

    const finalized = await scopedParentUpdate(supabase, input, {
      status: input.status,
      structured_result: sanitizePersistedValue(input.structuredResult),
      completed_at: completedAt,
      error_code: input.errorCode ?? null,
    });
    if (!finalized) {
      logAgentMetric("agentic.persist_failed", { table: "agent_runs", phase: "finalize" });
      throw new AgentError("AGENT_GOVERNANCE_UNAVAILABLE", "agent_run_finalize_failed", 503);
    }
  } catch (err) {
    await bestEffortMarkFailed(supabase, input, completedAt);
    throw err;
  }
}

async function scopedParentUpdate(
  supabase: SupabaseClient,
  input: PersistRunInput,
  patch: Record<string, unknown>
): Promise<boolean> {
  const { data, error } = await supabase
    .from("agent_runs")
    .update(patch)
    .eq("id", input.runId)
    .eq("tenant_id", input.context.tenantId)
    .eq("project_id", input.context.projectId)
    .eq("actor_user_id", input.context.userId)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data && (data as { id?: string }).id === input.runId);
}

async function bestEffortMarkFailed(
  supabase: SupabaseClient,
  input: PersistRunInput,
  completedAt: string
): Promise<void> {
  try {
    await supabase
      .from("agent_runs")
      .update({
        status: "FAILED",
        structured_result: null,
        completed_at: completedAt,
        error_code: "AGENT_GOVERNANCE_PERSISTENCE_FAILED",
      })
      .eq("id", input.runId)
      .eq("tenant_id", input.context.tenantId)
      .eq("project_id", input.context.projectId)
      .eq("actor_user_id", input.context.userId);
  } catch {
    // The original persistence failure remains authoritative.
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
    .order("created_at", { ascending: false })
    .limit(1)
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
  if (row.status !== "COMPLETED" && row.status !== "COMPLETED_WITH_LIMITATIONS" && row.status !== "INSUFFICIENT_EVIDENCE") {
    return null;
  }
  if (!row.structured_result || !row.created_at) return null;
  const createdAt = Date.parse(row.created_at);
  if (!Number.isFinite(createdAt) || createdAt < Date.parse(cutoff) || createdAt > now.getTime()) return null;
  return { id: row.id, structured_result: row.structured_result, status: row.status };
}

export function redactAgentRequest(request: Record<string, unknown>): Record<string, unknown> {
  const sanitized = sanitizePersistedValue(request);
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)
    ? (sanitized as Record<string, unknown>)
    : {};
}

export function sanitizePersistedValue(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[redacted-depth]";
  if (typeof value === "string") return redactSensitiveText(value);
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizePersistedValue(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (lower.includes("token") || lower.includes("secret") || lower.includes("password")) {
        out[key] = "[redacted-field]";
        continue;
      }
      out[key] = sanitizePersistedValue(item, depth + 1);
    }
    return out;
  }
  return null;
}

export function redactSensitiveText(value: string): string {
  const clipped = value.length > 2_000 ? value.slice(0, 2_000) : value;
  return clipped
    .replace(/https?:\/\/[^\s]+/gi, (url) =>
      /([?&](token|sig|signature|access_token|X-Amz-Signature)=)/i.test(url) ? "[redacted-url]" : url
    )
    .replace(/\b(sk-|rk-|xox[baprs]-)[A-Za-z0-9_-]{10,}/g, "[redacted-secret]")
    .replace(/\b(api[_-]?key|password|secret|bearer)\s*[:=]\s*\S+/gi, "[redacted-credential]");
}
