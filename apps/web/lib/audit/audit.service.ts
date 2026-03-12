/**
 * Audit service for platform core: AI conclusions, workflow execution, alert records.
 * Delegates persistence to existing observability/audit.service (audit_logs table).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { emitAudit } from "@/lib/observability/audit.service";
import type { AuditEntryParams, AiConclusionTraceParams, WorkflowTraceParams } from "./audit.types";

/** Record a generic audit entry. Best-effort; does not throw. */
export async function recordAuditEntry(
  supabase: SupabaseClient,
  params: AuditEntryParams
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: params.tenant_id,
    user_id: params.user_id ?? null,
    trace_id: params.trace_id ?? null,
    action: params.action,
    resource_type: params.resource_type ?? null,
    resource_id: params.resource_id ?? null,
    details: params.details ?? {},
  });
}

/** Record AI conclusion / copilot summary for explainability. */
export async function recordAiConclusionTrace(
  supabase: SupabaseClient,
  params: AiConclusionTraceParams
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: params.tenant_id,
    trace_id: params.trace_id ?? null,
    action: "copilot_brief_generated",
    resource_type: "project",
    resource_id: params.project_id,
    details: {
      source: params.source,
      use_case: params.use_case,
      conclusion_type: params.conclusion_type,
      summary: params.summary,
      risks: params.risks,
      recommendations: params.recommendations,
    },
  });
}

/** Record workflow execution step for traceability. */
export async function recordWorkflowTrace(
  supabase: SupabaseClient,
  params: WorkflowTraceParams
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: params.tenant_id,
    trace_id: params.trace_id ?? null,
    action: "workflow_action_dispatched",
    resource_type: "workflow",
    resource_id: params.rule_id,
    details: {
      trigger_type: params.trigger_type,
      conditions_passed: params.conditions_passed,
      actions_executed: params.actions_executed,
      project_id: params.project_id,
      error: params.error,
    },
  });
}
