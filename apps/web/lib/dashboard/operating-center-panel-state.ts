/**
 * Deterministic panel state derived from intelligence + ops for AI Operating Center.
 * Used for testing and consistent empty/degraded handling.
 */

import type { ProjectIntelligenceData } from "@/components/intelligence/types";

export interface OperatingCenterPanelState {
  hasHealth: boolean;
  hasRisks: boolean;
  hasSummary: boolean;
  hasEvidenceGaps: boolean;
  riskCount: number;
  evidenceGapCount: number;
  hasMissingDataDisclaimer: boolean;
  healthLabel: string | null;
}

export function getOperatingCenterPanelState(
  data: ProjectIntelligenceData | null | undefined
): OperatingCenterPanelState {
  if (!data) {
    return {
      hasHealth: false,
      hasRisks: false,
      hasSummary: false,
      hasEvidenceGaps: false,
      riskCount: 0,
      evidenceGapCount: 0,
      hasMissingDataDisclaimer: false,
      healthLabel: null,
    };
  }
  const health = data.projectHealthScore ?? data.health;
  const riskOverview = data.riskOverview ?? { high: 0, medium: 0, low: 0, signals: [] };
  const riskCount =
    riskOverview.high + riskOverview.medium + riskOverview.low + (riskOverview.signals?.length ?? 0) + (data.topRiskInsights?.length ?? 0);
  const evidenceSignals = data.evidenceCoverage?.signals ?? [];
  const summary = data.executiveProjectSummary ?? data.executiveSummary;
  const hasMissingDataDisclaimer = Boolean(
    health && "missingDataDisclaimer" in health && health.missingDataDisclaimer
  ) || Boolean(summary && "missingDataDisclaimer" in summary && summary.missingDataDisclaimer);
  return {
    hasHealth: Boolean(health),
    hasRisks: riskCount > 0,
    hasSummary: Boolean(summary),
    hasEvidenceGaps: evidenceSignals.length > 0,
    riskCount,
    evidenceGapCount: evidenceSignals.length,
    hasMissingDataDisclaimer,
    healthLabel: health && "label" in health ? health.label : null,
  };
}
