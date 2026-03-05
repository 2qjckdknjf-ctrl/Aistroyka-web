/**
 * AI governance: run policy, record decision, return allow/block/degrade.
 * Every AI request produces an audited policy decision (ai_policy_decisions).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluatePolicy } from "./policy.rules";
import type { PolicyContext, PolicyResult } from "./policy.types";
import { getPrivacySettings } from "@/lib/platform/privacy/privacy.service";

export type { PolicyResult, PolicyDecision } from "./policy.types";

const POLICY_VERSION = "1.0";

/** Trusted image URL hosts when pii_mode is strict (comma-separated env). Empty = allow all. */
function getTrustedImageHosts(): string[] {
  const raw = (process.env.AI_TRUSTED_IMAGE_HOSTS ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
}

/** Run policy and persist decision. Returns result with decisionId; callers must check result.decision before running AI. */
export async function runPolicy(
  supabase: SupabaseClient,
  ctx: PolicyContext,
  traceId?: string | null
): Promise<PolicyResult> {
  let result = evaluatePolicy(ctx);
  if (result.decision === "allow" && ctx.image_url) {
    const piiResult = await checkPiiImageUrl(supabase, ctx.tenant_id, ctx.image_url);
    if (!piiResult.allowed) {
      result = {
        decision: "block",
        rule_hits: [...result.rule_hits, piiResult.rule_hit ?? "pii_strict_block"],
        model_tier: result.model_tier,
      };
    }
  }
  const decisionId = await recordPolicyDecision(
    supabase,
    ctx.tenant_id,
    result.decision,
    result.rule_hits,
    traceId
  );
  return { ...result, decisionId };
}

/** Minimal PII hook: strict mode + untrusted image host => block. */
async function checkPiiImageUrl(
  supabase: SupabaseClient,
  tenantId: string,
  imageUrl: string
): Promise<{ allowed: boolean; rule_hit?: string }> {
  const settings = await getPrivacySettings(supabase, tenantId);
  if (!settings || settings.pii_mode !== "strict") return { allowed: true };
  let host: string;
  try {
    host = new URL(imageUrl).hostname.toLowerCase();
  } catch {
    return { allowed: false, rule_hit: "pii_strict_invalid_image_url" };
  }
  const trusted = getTrustedImageHosts();
  if (trusted.length === 0) return { allowed: true };
  if (trusted.includes(host)) return { allowed: true };
  return { allowed: false, rule_hit: "pii_strict_untrusted_image_host" };
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

/** Persist policy decision to ai_policy_decisions. Returns inserted id or null. */
export async function recordPolicyDecision(
  supabase: SupabaseClient,
  tenantId: string,
  decision: string,
  ruleHits: string[],
  traceId?: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("ai_policy_decisions")
      .insert({
        tenant_id: tenantId,
        trace_id: traceId ?? null,
        decision,
        rule_hits: ruleHits,
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch {
    return null;
  }
}
