const TARGET_SUCCESS_RATE = 0.999;

export function errorBudgetConsumed(requests: number, errors: number): number {
  if (requests <= 0) return 0;
  const successRate = 1 - errors / requests;
  const budget = 1 - TARGET_SUCCESS_RATE;
  return Math.min(1, Math.max(0, (1 - successRate) / budget));
}

export function isSloBreach(requests: number, errors: number): boolean {
  if (requests < 10) return false;
  return 1 - errors / requests < TARGET_SUCCESS_RATE;
}
