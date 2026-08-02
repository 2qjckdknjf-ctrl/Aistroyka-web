import type { SupabaseClient } from "@supabase/supabase-js";
import type { MultiRateLimitResult, RateLimitBucketInput } from "./rate-limit-multi.algorithm";

/** Build key for rate limit: tenant, user, or IP + endpoint. */
export function rateLimitKey(kind: "tenant" | "ip" | "user", id: string, endpoint: string): string {
  const safe = endpoint.replace(/[^a-z0-9_-]/gi, "_");
  return `${kind}:${id}:${safe}`;
}

/** Get current minute window (truncate to minute). */
export function currentRateLimitWindow(): string {
  const d = new Date();
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

export type RateIncrementResult =
  | { ok: true; allowed: boolean; current: number }
  | { ok: false; reason: "error" };

export type MultiRateIncrementResult =
  | { ok: true; result: MultiRateLimitResult }
  | { ok: false; reason: "error" };

/**
 * Legacy increment (SELECT then UPDATE/INSERT). Slightly racy under concurrency.
 * Kept for existing non-strict callers (sync/ack, AI routes, login). Do not use for help strict paths.
 */
export async function checkAndIncrement(
  supabase: SupabaseClient,
  key: string,
  limit: number
): Promise<{ allowed: boolean; current: number }> {
  const windowStart = currentRateLimitWindow();
  const { data: existing } = await supabase
    .from("rate_limit_slots")
    .select("count")
    .eq("key", key)
    .eq("window_start", windowStart)
    .maybeSingle();

  const newCount = (existing?.count ?? 0) + 1;
  if (existing) {
    await supabase.from("rate_limit_slots").update({ count: newCount }).eq("key", key).eq("window_start", windowStart);
  } else {
    await supabase.from("rate_limit_slots").insert({ key, window_start: windowStart, count: 1 });
  }
  return { allowed: newCount <= limit, current: newCount };
}

/**
 * Strict single-key atomic increment via DB RPC `rate_limit_try_increment`.
 * Prefer `checkAndIncrementMultiStrict` for help (all-or-nothing multi-dimension).
 */
export async function checkAndIncrementStrict(
  supabase: SupabaseClient,
  key: string,
  limit: number
): Promise<RateIncrementResult> {
  if (!key || limit < 1) {
    return { ok: false, reason: "error" };
  }
  const windowStart = currentRateLimitWindow();
  const { data, error } = await supabase.rpc("rate_limit_try_increment", {
    p_key: key,
    p_window_start: windowStart,
    p_limit: limit,
  });

  if (error) {
    return { ok: false, reason: "error" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (
    !row ||
    typeof row !== "object" ||
    typeof (row as { allowed?: unknown }).allowed !== "boolean" ||
    typeof (row as { current_count?: unknown }).current_count !== "number"
  ) {
    return { ok: false, reason: "error" };
  }

  return {
    ok: true,
    allowed: (row as { allowed: boolean }).allowed,
    current: (row as { current_count: number }).current_count,
  };
}

function isMultiResult(value: unknown): value is MultiRateLimitResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.allowed !== "boolean") return false;
  if (!Array.isArray(v.buckets)) return false;
  if (v.allowed === false) {
    if (typeof v.limited_dimension !== "string") return false;
    if (typeof v.limited_key !== "string") return false;
    if (typeof v.current_count !== "number") return false;
    if (typeof v.limit !== "number") return false;
  }
  return true;
}

/**
 * Strict multi-dimension atomic decision via `rate_limit_try_increment_multi`.
 * One RPC / one DB transaction: either every bucket is charged once, or none are.
 * Buckets are sorted by key inside the SQL function (deadlock-safe lock order).
 */
export async function checkAndIncrementMultiStrict(
  supabase: SupabaseClient,
  buckets: RateLimitBucketInput[]
): Promise<MultiRateIncrementResult> {
  if (!buckets.length || buckets.some((b) => !b.key || b.limit < 1 || !b.dimension)) {
    return { ok: false, reason: "error" };
  }
  const windowStart = currentRateLimitWindow();
  const { data, error } = await supabase.rpc("rate_limit_try_increment_multi", {
    p_window_start: windowStart,
    p_buckets: buckets,
  });

  if (error) {
    return { ok: false, reason: "error" };
  }

  const payload = typeof data === "string" ? safeJsonParse(data) : data;
  if (!isMultiResult(payload)) {
    return { ok: false, reason: "error" };
  }
  return { ok: true, result: payload };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
