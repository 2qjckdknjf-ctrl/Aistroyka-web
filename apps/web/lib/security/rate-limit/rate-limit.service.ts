/**
 * In-memory rate limiter. Use for API routes, copilot, webhooks when DB is not required.
 * Simple fixed window per key.
 */

import type { RateLimitConfig, RateLimitResult } from "./rate-limit.types";

interface Slot {
  count: number;
  windowStart: number;
}

const store = new Map<string, Slot>();

function currentWindowStart(windowSec: number): number {
  return Math.floor(Date.now() / 1000 / windowSec) * windowSec;
}

function prune(keyPrefix: string): void {
  const keys: string[] = [];
  store.forEach((_, k) => {
    if (k.startsWith(keyPrefix)) keys.push(k);
  });
  keys.forEach((k) => store.delete(k));
}

/**
 * Check and increment. Returns allowed and remaining count for the current window.
 */
export function checkInMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowSec } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = currentWindowStart(windowSec);
  const slot = store.get(key);

  if (!slot || slot.windowStart !== windowStart) {
    const newSlot: Slot = { count: 1, windowStart };
    store.set(key, newSlot);
    return {
      allowed: 1 <= limit,
      remaining: Math.max(0, limit - 1),
      resetAt: windowStart + windowSec,
    };
  }

  slot.count += 1;
  const allowed = slot.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - slot.count),
    resetAt: slot.windowStart + windowSec,
  };
}

export function buildKey(scope: string, identifier: string, suffix?: string): string {
  const safe = identifier.replace(/[^a-z0-9_-]/gi, "_");
  return suffix ? `${scope}:${safe}:${suffix}` : `${scope}:${safe}`;
}

/** Clear in-memory store (e.g. for tests). Optional prefix to clear only a scope. */
export function clearInMemoryRateLimitStore(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear();
    return;
  }
  prune(keyPrefix);
}
