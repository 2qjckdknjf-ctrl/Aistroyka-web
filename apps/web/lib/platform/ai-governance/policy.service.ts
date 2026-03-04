import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIPolicyContext, AIPolicyResult } from "./policy.types";
import { evaluatePolicy } from "./policy.rules";
import { getModelForTier } from "./model-routing.service";

export function checkPolicy(ctx: AIPolicyContext): AIPolicyResult {
  const { decision, rule_hits } = evaluatePolicy(ctx);
  const model_override = getModelForTier(ctx.tier).primary;
  return {
    decision,
    rule_hits,
    model_override: decision === "allow" ? model_override : undefined,
  };
}

export async function recordPolicyDecision(
  supabase: SupabaseClient,
  tenantId: string,
  decision: string,
  ruleHits: string[],
  traceId?: string | null
): Promise<void> {
  try {
    await supabase.from("ai_policy_decisions").insert({
      tenant_id: tenantId,
      trace_id: traceId ?? null,
      decision,
      rule_hits: ruleHits,
    });
  } catch {
    //
  }
}
