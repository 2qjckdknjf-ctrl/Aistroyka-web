/** Release posture decision — engineering intelligence canonical form. */
export type RomaReleaseDecision = "ready" | "not_ready" | "ready_with_warnings" | "unknown";

export type RomaReadinessLevel = "ready" | "partial" | "blocked" | "unknown";

export type RomaReleaseImpact = "none" | "low" | "medium" | "high";

export type RomaReleaseGateRef = {
  id: string;
  label: string;
  impact: RomaReleaseImpact;
};
