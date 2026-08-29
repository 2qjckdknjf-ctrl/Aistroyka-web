/**
 * Persist agent runs, steps, and proposed actions. No secrets or signed URLs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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

export async function persistAgentRun(supabase: SupabaseClient, input: PersistRunInput): Promise<void> {
  const { error } = await supabase.from("agent_runs").insert({
    id: input.runId,
    tenant_id: input.context.tenantId,
    project_id: input.context.projectId,
    actor_user_id: input.context.userId,
    agent_type: "project_delivery",
    request: redactRequest(input.request),
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
    return;
  }

  if (input.steps.length > 0) {
    await supabase.from("agent_run_steps").insert(
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
  }

  if (input.proposed.length > 0) {
    await supabase.from("proposed_agent_actions").insert(
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
  }
}

export async function findRunByIdempotency(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  idempotencyKey: string
): Promise<{ id: string; structured_result: unknown; status: string } | null> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, structured_result, status")
    .eq("tenant_id", tenantId)
    .eq("actor_user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; structured_result: unknown; status: string };
}

function redactRequest(request: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request)) {
    const lower = k.toLowerCase();
    if (lower.includes("token") || lower.includes("secret") || lower.includes("password")) continue;
    if (typeof v === "string" && v.startsWith("http") && v.includes("token=")) {
      out[k] = "[redacted-url]";
      continue;
    }
    out[k] = v;
  }
  return out;
}
