/**
 * Rate limit abstraction for API, copilot, webhooks.
 * Implementations can be in-memory or backend (e.g. Supabase).
 */

export interface RateLimitConfig {
  /** Max requests per window. */
  limit: number;
  /** Window duration in seconds. */
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimitScope = "api" | "copilot" | "webhook";
