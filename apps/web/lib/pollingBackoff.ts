/**
 * Exponential backoff for polling.
 * Start 2s, double each step, cap at 20s.
 * Reset on success (caller resets attempt index).
 */

export const POLL_INTERVAL_INITIAL_MS = 2000;
export const POLL_INTERVAL_MAX_MS = 20_000;

export function getBackoffMs(attemptIndex: number): number {
  const ms = POLL_INTERVAL_INITIAL_MS * Math.pow(2, attemptIndex);
  return Math.min(ms, POLL_INTERVAL_MAX_MS);
}
