import type { RomaEntityId } from "../shared";
import type { RomaAuditOutcomeStatus } from "../shared/status";
import type { RomaConfidence } from "../decision/confidence";
import type { RomaReleaseDecision } from "../release/release-decision";
import type { RomaEvidence } from "../evidence/evidence";
import type { RomaFinding } from "../findings/finding";
import type { RomaRecommendation } from "../recommendations/recommendation";

export type RomaAuditMode = "safe_readonly" | "snapshot" | "manual";

export type RomaAuditSnapshot = {
  auditId: RomaEntityId;
  mode: RomaAuditMode;
  status: RomaAuditOutcomeStatus;
  createdAt: string;
  releaseDecision: RomaReleaseDecision;
  confidence: RomaConfidence;
  evidence: readonly RomaEvidence[];
  findings: readonly RomaFinding[];
  recommendations: readonly RomaRecommendation[];
};
