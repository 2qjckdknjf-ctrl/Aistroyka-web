/**
 * Policy rules: tier, resource type, limits. Returns rule hits and effective decision.
 */

import type { PolicyContext, PolicyResult } from "./policy.types";

const MAX_IMAGE_SIZE_BYTES: Record<string, number> = {
  FREE: 5 * 1024 * 1024,      // 5 MB
  PRO: 10 * 1024 * 1024,      // 10 MB
  ENTERPRISE: 20 * 1024 * 1024,
};

/** Daily-work video: larger than single-image caps (timelapse / walkthrough). */
const MAX_VIDEO_SIZE_BYTES: Record<string, number> = {
  FREE: 25 * 1024 * 1024,
  PRO: 100 * 1024 * 1024,
  ENTERPRISE: 500 * 1024 * 1024,
};
const MAX_IMAGE_COUNT: Record<string, number> = {
  FREE: 5,
  PRO: 20,
  ENTERPRISE: 100,
};

export function evaluatePolicy(ctx: PolicyContext): PolicyResult {
  const tier = (ctx.subscription_tier ?? "FREE").toUpperCase();
  const ruleHits: string[] = [];

  if (tier !== "FREE" && tier !== "PRO" && tier !== "ENTERPRISE") {
    ruleHits.push("tier_unknown");
    return { decision: "degrade", rule_hits: ruleHits, model_tier: "free" };
  }

  if (ctx.image_count != null && ctx.image_count > (MAX_IMAGE_COUNT[tier] ?? 5)) {
    ruleHits.push("max_image_count_exceeded");
    return { decision: "block", rule_hits: ruleHits };
  }

  if (ctx.image_size_bytes != null && ctx.image_size_bytes > (MAX_IMAGE_SIZE_BYTES[tier] ?? MAX_IMAGE_SIZE_BYTES.FREE)) {
    ruleHits.push("max_image_size_exceeded");
    return { decision: "block", rule_hits: ruleHits };
  }

  if (ctx.video_size_bytes != null && ctx.video_size_bytes > (MAX_VIDEO_SIZE_BYTES[tier] ?? MAX_VIDEO_SIZE_BYTES.FREE)) {
    ruleHits.push("max_video_size_exceeded");
    return { decision: "block", rule_hits: ruleHits };
  }

  ruleHits.push("tier_allow");
  const modelTier = tier === "ENTERPRISE" ? "enterprise" : tier === "PRO" ? "pro" : "free";
  return { decision: "allow", rule_hits: ruleHits, model_tier: modelTier };
}

/** Max video payload size for a subscription tier (policy + fetch cap). */
export function maxVideoBytesForSubscriptionTier(subscriptionTier: string | null | undefined): number {
  const tier = (subscriptionTier ?? "FREE").toUpperCase();
  return MAX_VIDEO_SIZE_BYTES[tier] ?? MAX_VIDEO_SIZE_BYTES.FREE;
}
