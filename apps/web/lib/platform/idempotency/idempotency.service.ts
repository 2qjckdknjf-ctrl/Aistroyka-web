import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./idempotency.repository";
import { IDEMPOTENCY_TTL_HOURS } from "./idempotency.types";

export const IDEMPOTENCY_HEADER = "x-idempotency-key";

/**
 * If idempotency key is present and we have a cached response, return it.
 * Otherwise return null (caller should run handler and then store).
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

/**
 * Store response for idempotency key. Call after successful handler execution.
 */
export async function storeResponse(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number
): Promise<void> {
  await repo.store(supabase, key, tenantId, userId, route, response, statusCode, IDEMPOTENCY_TTL_HOURS);
}
