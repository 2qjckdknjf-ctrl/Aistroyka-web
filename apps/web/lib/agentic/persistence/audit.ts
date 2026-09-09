/**
 * Agent run audit via existing audit_logs. No secrets.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { emitAudit } from "@/lib/observability/audit.service";
import type { AgentExecutionContext } from "../types";

export async function auditAgentRun(
  supabase: SupabaseClient,
  input: {
    context: AgentExecutionContext;
    runId: string;
    skills: string[];
    status: string;
    proposedCount: number;
    errorCode?: string | null;
  }
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: input.context.tenantId,
    user_id: input.context.userId,
    trace_id: input.context.traceId,
    action: "agent_run_completed",
    resource_type: "project",
    resource_id: input.context.projectId,
    details: {
      run_id: input.runId,
      skills: input.skills,
      status: input.status,
      proposed_count: input.proposedCount,
      error_code: input.errorCode ?? null,
      source: input.context.source,
    },
  });
}
