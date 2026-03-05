/**
 * Error budget: simple ratio (errors/requests). Configurable SLO target (e.g. 99.9% availability).
 */

export const DEFAULT_AVAILABILITY_TARGET = 0.999;

/** Consumed error budget for a window: (errors/requests) / (1 - target). 1 = budget exhausted. */
export function consumedErrorBudget(requests: number, errors: number, target: number = DEFAULT_AVAILABILITY_TARGET): number {
  if (requests <= 0) return 0;
  const errorRate = errors / requests;
  const budget = 1 - target;
  if (budget <= 0) return 0;
  return Math.min(1, errorRate / budget);
}
