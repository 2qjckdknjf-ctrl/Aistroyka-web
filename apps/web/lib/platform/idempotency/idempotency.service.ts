import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./idempotency.repository";
import { IDEMPOTENCY_TTL_HOURS } from "./idempotency.types";

export const IDEMPOTENCY_HEADER = "x-idempotency-key";
export { IDEMPOTENCY_PENDING_STATUS } from "./idempotency.repository";
export type { CachedLookup, MutateResult, StrictClaimResult } from "./idempotency.repository";

/**
 * If idempotency key is present and we have a cached response, return it.
 * Otherwise return null (caller should run handler and then store).
 * Legacy: DB errors / expired collapse to null.
 */
export async function getCachedResponse(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<{ response: unknown; statusCode: number } | null> {
  const cached = await repo.getCached(supabase, key, tenantId, userId, route);
  if (!cached) return null;
  return { response: cached.response, statusCode: cached.status_code };
}

/** Strict lookup — distinguishes miss / hit / expired / error. */
export async function lookupCachedResponse(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<repo.CachedLookup> {
  return repo.lookupCached(supabase, key, tenantId, userId, route);
}

/**
 * Store response for idempotency key. Call after successful handler execution.
 * Returns false when the underlying write fails (callers should fail closed).
 */
export async function storeResponse(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number
): Promise<boolean> {
  return repo.store(supabase, key, tenantId, userId, route, response, statusCode, IDEMPOTENCY_TTL_HOURS);
}

/** Legacy claim — claimed | exists | error (no reclaim). */
export async function claimIdempotencySlot(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<"claimed" | "exists" | "error"> {
  return repo.claimPending(supabase, key, tenantId, userId, route, IDEMPOTENCY_TTL_HOURS);
}

/** Strict claim with expired reclaim + ownership token. */
export async function claimIdempotencySlotStrict(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<repo.StrictClaimResult> {
  return repo.claimPendingStrict(supabase, key, tenantId, userId, route, IDEMPOTENCY_TTL_HOURS);
}

export async function finalizeIdempotencySlot(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number,
  claimToken: string
): Promise<repo.MutateResult> {
  return repo.finalizeClaim(
    supabase,
    key,
    tenantId,
    userId,
    route,
    response,
    statusCode,
    IDEMPOTENCY_TTL_HOURS,
    claimToken
  );
}

export async function releaseIdempotencySlot(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  claimToken: string
): Promise<repo.MutateResult> {
  return repo.releaseClaim(supabase, key, tenantId, userId, route, claimToken);
}
