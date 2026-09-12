import type { SupabaseClient } from "@supabase/supabase-js";
import { IDEMPOTENCY_TTL_HOURS } from "@/lib/platform/idempotency/idempotency.types";
import { AgentError } from "./errors";

export interface AgentIdempotencyScope {
  tenantId: string;
  projectId: string;
  userId: string;
  key: string;
}

export async function claimAgentIdempotencyKey(
  supabase: SupabaseClient,
  scope: AgentIdempotencyScope
): Promise<string | null> {
  const { data, error } = await supabase.rpc("claim_agent_idempotency_key", {
    p_tenant_id: scope.tenantId,
    p_project_id: scope.projectId,
    p_actor_user_id: scope.userId,
    p_idempotency_key: scope.key,
    p_ttl_seconds: IDEMPOTENCY_TTL_HOURS * 60 * 60,
  });
  if (error) {
    throw new AgentError(
      "AGENT_GOVERNANCE_UNAVAILABLE",
      "agent_idempotency_claim_failed",
      503
    );
  }
  return typeof data === "string" && data.length > 0 ? data : null;
}

export async function releaseAgentIdempotencyKey(
  supabase: SupabaseClient,
  scope: AgentIdempotencyScope,
  claimToken: string
): Promise<void> {
  const { data, error } = await supabase.rpc("release_agent_idempotency_key", {
    p_tenant_id: scope.tenantId,
    p_project_id: scope.projectId,
    p_actor_user_id: scope.userId,
    p_idempotency_key: scope.key,
    p_claim_token: claimToken,
  });
  if (error || data !== true) {
    throw new AgentError(
      "AGENT_GOVERNANCE_UNAVAILABLE",
      "agent_idempotency_release_failed",
      503
    );
  }
}
