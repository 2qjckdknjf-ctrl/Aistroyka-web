import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimitsForTenant } from "@/lib/platform/subscription/subscription.service";
import { rateLimitKey, checkAndIncrement } from "./rate-limit.store";

export const HIGH_RISK_ENDPOINTS = [
  "/api/v1/ai/analyze-image",
  "/api/v1/worker/report/submit",
  "/api/v1/jobs/process",
  "/api/auth/login",
] as const;

const DEFAULT_IP_LIMIT = 10;

/** Returns null if allowed; error message if rate limited. Use admin client for rate_limit_slots. */
export async function checkRateLimit(
  supabase: SupabaseClient,
  options: { tenantId: string | null; ip: string; endpoint: string }
): Promise<{ limited: false } | { limited: true; message: string }> {
  const { tenantId, ip, endpoint } = options;
  const safeEndpoint = endpoint.replace(/[^a-z0-9/_-]/gi, "_");

  let ipLimit = DEFAULT_IP_LIMIT;
  if (tenantId) {
    const limits = await getLimitsForTenant(supabase, tenantId);
    ipLimit = limits.per_minute_rate_limit_ip;
    const tenantKey = rateLimitKey("tenant", tenantId, safeEndpoint);
    const { allowed } = await checkAndIncrement(supabase, tenantKey, limits.per_minute_rate_limit_tenant);
    if (!allowed) return { limited: true, message: "Tenant rate limit exceeded. Try again later." };
  }

  const ipKey = rateLimitKey("ip", ip, safeEndpoint);
  const { allowed } = await checkAndIncrement(supabase, ipKey, ipLimit);
  if (!allowed) {
    return { limited: true, message: "Too many requests from this IP." };
  }

  return { limited: false };
}
