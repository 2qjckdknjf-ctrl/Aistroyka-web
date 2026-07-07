import type { RomaSeverity } from "../shared/severity";
import type { RomaReleaseDecision } from "../release/release-decision";

/** Decision confidence — includes unknown for fail-closed modules. */
export type RomaConfidence = "high" | "medium" | "low" | "unknown";

export type RomaDecisionReason = {
  id: string;
  title: string;
  severity: RomaSeverity;
  summary: string;
  evidence?: string;
};

export type RomaDecision = {
  release: RomaReleaseDecision;
  confidence: RomaConfidence;
  reasons: readonly RomaDecisionReason[];
};

/** Intelligence-facing confidence without unknown (legacy module subset). */
export type RomaConfidenceCore = Exclude<RomaConfidence, "unknown">;
