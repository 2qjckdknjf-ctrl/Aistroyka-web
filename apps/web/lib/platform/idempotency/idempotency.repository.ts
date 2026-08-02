import type { SupabaseClient } from "@supabase/supabase-js";

/** Pending claim marker — status_code 0 + null business response means in-flight. */
export const IDEMPOTENCY_PENDING_STATUS = 0;

/** Postgres unique_violation — only this code means "row already exists". */
export const PG_UNIQUE_VIOLATION = "23505";

export type CachedLookup =
  | { kind: "miss" }
  | { kind: "hit"; response: unknown; status_code: number; claim_token: string | null }
  | { kind: "expired"; response: unknown; status_code: number; claim_token: string | null }
  | { kind: "error" };

export type StrictClaimResult =
  | { kind: "claimed"; claimToken: string }
  | { kind: "completed"; response: unknown; statusCode: number }
  | { kind: "in_flight" }
  | { kind: "error" };

export type MutateResult = { ok: true } | { ok: false; reason: "error" | "not_found" };

function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return typeof error?.code === "string" && error.code === PG_UNIQUE_VIOLATION;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

function isCompletedStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300 && statusCode !== IDEMPOTENCY_PENDING_STATUS;
}

function newClaimToken(): string {
  return crypto.randomUUID();
}

/**
 * Legacy-compatible lookup: miss/expired/error all collapse to null.
 * Prefer `lookupCached` for strict paths.
 */
export async function getCached(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<{ response: unknown; status_code: number } | null> {
  const lookup = await lookupCached(supabase, key, tenantId, userId, route);
  if (lookup.kind === "hit") {
    return { response: lookup.response, status_code: lookup.status_code };
  }
  return null;
}

/** Strict lookup — DB errors are never treated as miss/in-flight. */
export async function lookupCached(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<CachedLookup> {
  // Prefer selecting claim_token when present; fall back for DBs that have not
  // applied 20260725190000_rate_limit_try_increment.sql yet.
  let data: unknown = null;
  let error: { code?: string; message?: string } | null = null;
  {
    const primary = await supabase
      .from("idempotency_keys")
      .select("response, status_code, expires_at, claim_token")
      .eq("key", key)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("route", route)
      .maybeSingle();
    if (
      primary.error &&
      (primary.error.code === "PGRST204" || /claim_token/i.test(primary.error.message || ""))
    ) {
      const fallback = await supabase
        .from("idempotency_keys")
        .select("response, status_code, expires_at")
        .eq("key", key)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("route", route)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    } else {
      data = primary.data;
      error = primary.error;
    }
  }

  if (error) return { kind: "error" };
  if (!data) return { kind: "miss" };

  const row = data as {
    response: unknown;
    status_code: number;
    expires_at: string;
    claim_token?: string | null;
  };
  const token = typeof row.claim_token === "string" ? row.claim_token : null;
  if (isExpired(row.expires_at)) {
    return {
      kind: "expired",
      response: row.response,
      status_code: row.status_code,
      claim_token: token,
    };
  }
  return {
    kind: "hit",
    response: row.response,
    status_code: row.status_code,
    claim_token: token,
  };
}

/**
 * Legacy upsert. Returns false when the write fails so callers can fail closed
 * instead of silently allowing duplicate side effects on replay.
 */
export async function store(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number,
  ttlHours: number
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  // Do not write claim_token here: that column exists only after
  // 20260725190000_rate_limit_try_increment.sql (may be unapplied). Legacy
  // replay must work without that migration.
  const { error } = await supabase.from("idempotency_keys").upsert(
    {
      key,
      tenant_id: tenantId,
      user_id: userId,
      route,
      response,
      status_code: statusCode,
      expires_at: expiresAt,
    },
    { onConflict: "key" }
  );
  return !error;
}

async function insertPending(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  ttlHours: number,
  claimToken: string
): Promise<"claimed" | "unique" | "error"> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("idempotency_keys").insert({
    key,
    tenant_id: tenantId,
    user_id: userId,
    route,
    response: null,
    status_code: IDEMPOTENCY_PENDING_STATUS,
    expires_at: expiresAt,
    claim_token: claimToken,
  });
  if (!error) return "claimed";
  if (isUniqueViolation(error)) return "unique";
  return "error";
}

/**
 * Race-safe reclaim of an expired slot: DELETE expired row then INSERT pending with new token.
 * Two concurrent reclaimers: only one DELETE succeeds; the loser re-reads.
 */
async function reclaimExpiredSlot(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  ttlHours: number
): Promise<StrictClaimResult> {
  const nowIso = new Date().toISOString();
  const claimToken = newClaimToken();
  const { data: deleted, error: delError } = await supabase
    .from("idempotency_keys")
    .delete()
    .eq("key", key)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("route", route)
    .lt("expires_at", nowIso)
    .select("key");

  if (delError) return { kind: "error" };

  if (!deleted || deleted.length === 0) {
    return classifyExisting(supabase, key, tenantId, userId, route, ttlHours, /*allowReclaim*/ false);
  }

  const inserted = await insertPending(supabase, key, tenantId, userId, route, ttlHours, claimToken);
  if (inserted === "claimed") return { kind: "claimed", claimToken };
  if (inserted === "error") return { kind: "error" };
  return classifyExisting(supabase, key, tenantId, userId, route, ttlHours, /*allowReclaim*/ false);
}

async function classifyExisting(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  ttlHours: number,
  allowReclaim: boolean
): Promise<StrictClaimResult> {
  const lookup = await lookupCached(supabase, key, tenantId, userId, route);
  switch (lookup.kind) {
    case "error":
      return { kind: "error" };
    case "miss": {
      const claimToken = newClaimToken();
      const again = await insertPending(supabase, key, tenantId, userId, route, ttlHours, claimToken);
      if (again === "claimed") return { kind: "claimed", claimToken };
      if (again === "error") return { kind: "error" };
      return classifyExisting(supabase, key, tenantId, userId, route, ttlHours, false);
    }
    case "expired":
      if (allowReclaim) {
        return reclaimExpiredSlot(supabase, key, tenantId, userId, route, ttlHours);
      }
      return { kind: "in_flight" };
    case "hit": {
      if (isCompletedStatus(lookup.status_code) && lookup.response != null) {
        return {
          kind: "completed",
          response: lookup.response,
          statusCode: lookup.status_code,
        };
      }
      return { kind: "in_flight" };
    }
    default: {
      const _exhaustive: never = lookup;
      return _exhaustive;
    }
  }
}

/**
 * Legacy claim (unique via 23505 only). No reclaim / no ownership token return.
 */
export async function claimPending(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  ttlHours: number
): Promise<"claimed" | "exists" | "error"> {
  const inserted = await insertPending(
    supabase,
    key,
    tenantId,
    userId,
    route,
    ttlHours,
    newClaimToken()
  );
  if (inserted === "claimed") return "claimed";
  if (inserted === "unique") return "exists";
  return "error";
}

/**
 * Strict claim with expired-slot reclaim + opaque ownership token.
 */
export async function claimPendingStrict(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  ttlHours: number
): Promise<StrictClaimResult> {
  const claimToken = newClaimToken();
  const inserted = await insertPending(supabase, key, tenantId, userId, route, ttlHours, claimToken);
  if (inserted === "claimed") return { kind: "claimed", claimToken };
  if (inserted === "error") return { kind: "error" };
  return classifyExisting(supabase, key, tenantId, userId, route, ttlHours, /*allowReclaim*/ true);
}

export async function finalizeClaim(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number,
  ttlHours: number,
  claimToken: string
): Promise<MutateResult> {
  if (!claimToken) return { ok: false, reason: "not_found" };
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("idempotency_keys")
    .update({
      response,
      status_code: statusCode,
      expires_at: expiresAt,
      claim_token: null,
    })
    .eq("key", key)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("route", route)
    .eq("status_code", IDEMPOTENCY_PENDING_STATUS)
    .eq("claim_token", claimToken)
    .select("key");

  if (error) return { ok: false, reason: "error" };
  if (!data || data.length === 0) return { ok: false, reason: "not_found" };
  return { ok: true };
}

export async function releaseClaim(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  claimToken: string
): Promise<MutateResult> {
  if (!claimToken) return { ok: false, reason: "not_found" };
  const { data, error } = await supabase
    .from("idempotency_keys")
    .delete()
    .eq("key", key)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("route", route)
    .eq("status_code", IDEMPOTENCY_PENDING_STATUS)
    .eq("claim_token", claimToken)
    .select("key");

  if (error) return { ok: false, reason: "error" };
  if (!data || data.length === 0) return { ok: false, reason: "not_found" };
  return { ok: true };
}
