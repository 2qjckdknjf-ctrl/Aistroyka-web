/** Job queue config: backoff, limits, time budget for worker. */

export const JOB_CONFIG = {
  /** Max jobs to claim per process run. */
  DEFAULT_CLAIM_LIMIT: 5,
  MAX_CLAIM_LIMIT: 20,
  /** Default max attempts before dead-letter. */
  DEFAULT_MAX_ATTEMPTS: 5,
  /** Base delay in ms for exponential backoff (attempt 1 = 1 * BASE, attempt 2 = 2 * BASE, ...). */
  BACKOFF_BASE_MS: 2000,
  /** Max run_after delay (cap). */
  BACKOFF_MAX_MS: 600_000,
  /** Worker time budget: stop processing before this (ms) to avoid Cloudflare timeout. */
  WORKER_TIME_BUDGET_MS: 25_000,
} as const;

export function nextRunAfter(attempt: number): Date {
  const base = JOB_CONFIG.BACKOFF_BASE_MS;
  const delay = Math.min(attempt * base, JOB_CONFIG.BACKOFF_MAX_MS);
  return new Date(Date.now() + delay);
}
