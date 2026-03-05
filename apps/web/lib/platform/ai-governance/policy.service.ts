/**
 * AI governance: run policy, record decision, return allow/block/degrade.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluatePolicy } from "./policy.rules";
import type { PolicyContext, PolicyResult } from "./policy.types";

export type { PolicyResult, PolicyDecision } from "./policy.types";

/** Run policy and persist decision. Returns result; callers must check result.decision before running AI. */
export async function runPolicy(
  supabase: SupabaseClient,
  ctx: PolicyContext,
  traceId?: string | null
): Promise<PolicyResult> {
  const result = evaluatePolicy(ctx);
  await recordPolicyDecision(supabase, ctx.tenant_id, result.decision, result.rule_hits, traceId);
  return result;
}

/** Synchronous policy check (no persist). Use with recordPolicyDecision after. */
export function checkPolicy(ctx: {
  tenant_id: string;
  tier: string;
  resource_type?: "media" | "report";
  image_count?: number;
  image_size_bytes?: number;
  trace_id?: string | null;
}): PolicyResult {
  return evaluatePolicy({
    tenant_id: ctx.tenant_id,
    subscription_tier: ctx.tier,
    resource_type: ctx.resource_type,
    image_count: ctx.image_count,
    image_size_bytes: ctx.image_size_bytes,
  });
}

/** Persist policy decision to ai_policy_decisions. */
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
    /* best-effort */
  }
}
