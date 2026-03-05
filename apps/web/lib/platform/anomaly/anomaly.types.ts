export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export interface AnomalyResult {
  severity: AnomalySeverity;
  type: string;
  metric: string;
  observed: number;
  expected: number;
  details?: Record<string, unknown>;
}
