/** Canonical risk classification. */
export type RomaRiskLevel = "critical" | "high" | "medium" | "low" | "unknown";

export type RomaRiskRef = {
  id: string;
  label: string;
  level: RomaRiskLevel;
  criticality?: RomaRiskLevel;
};
