import type { AIPolicyContext, AIPolicyDecision } from "./policy.types";

const MAX_IMAGE_SIZE: Record<string, number> = { FREE: 5242880, PRO: 10485760, ENTERPRISE: 52428800 };
const MAX_IMAGE_COUNT: Record<string, number> = { FREE: 5, PRO: 20, ENTERPRISE: 100 };

export function evaluatePolicy(ctx: AIPolicyContext): { decision: AIPolicyDecision; rule_hits: string[] } {
  const hits: string[] = [];
  const tier = ctx.tier ?? "FREE";
  const maxSize = MAX_IMAGE_SIZE[tier] ?? MAX_IMAGE_SIZE.FREE;
  const maxCount = MAX_IMAGE_COUNT[tier] ?? MAX_IMAGE_COUNT.FREE;
  if (ctx.image_size_bytes != null && ctx.image_size_bytes > maxSize) {
    hits.push("max_image_size");
    return { decision: "block", rule_hits: hits };
  }
  if (ctx.image_count != null && ctx.image_count > maxCount) {
    hits.push("max_image_count");
    return { decision: "block", rule_hits: hits };
  }
  hits.push("tier_" + tier.toLowerCase());
  return { decision: "allow", rule_hits: hits };
}
