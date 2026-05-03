import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkAndIncrement, rateLimitKey } from "@/lib/platform/rate-limit/rate-limit.store";

function readLimit(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * IP + user rate limits for owner surfaces (DB-backed when supabase is service-role).
 */
export async function assertOwnerRateLimit(
  supabase: SupabaseClient | null,
  input: { userId: string; clientIp: string | null; surface: "owner_page" | "owner_api" }
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!supabase) {
    return { ok: true };
  }

  const ipLimit = readLimit("OWNER_RATE_LIMIT_IP_PER_MINUTE", 120);
  const userLimit = readLimit("OWNER_RATE_LIMIT_USER_PER_MINUTE", 60);
  const suffix = input.surface;

  if (input.clientIp) {
    const ipKey = rateLimitKey("ip", input.clientIp, `owner_${suffix}`);
    const { allowed } = await checkAndIncrement(supabase, ipKey, ipLimit);
    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "rate_limited", code: "owner_rate_limit_ip" },
          { status: 429, headers: { "Retry-After": "60" } }
        ),
      };
    }
  }

  const userKey = rateLimitKey("tenant", input.userId, `owner_${suffix}`);
  const { allowed: uOk } = await checkAndIncrement(supabase, userKey, userLimit);
  if (!uOk) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "rate_limited", code: "owner_rate_limit_user" },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
    };
  }

  return { ok: true };
}
