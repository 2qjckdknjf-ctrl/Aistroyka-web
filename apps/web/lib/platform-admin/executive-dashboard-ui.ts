import type { RomaEngineeringIntelligence, DecisionReason } from "./roma-engineering-intelligence.types";
import type { RomaQualityDashboard, QualityComponentCard, BlockerSeverity } from "./roma-quality-dashboard.types";
import type { RomaAuditRunListItem } from "./roma-run-history.types";
import { formatPercent, formatTimestamp } from "./quality-dashboard-ui";

export function findSystemComponent(
  dashboard: RomaQualityDashboard,
  id: string
): QualityComponentCard | undefined {
  return dashboard.systemComponents.find((c) => c.id === id);
}

/** Executive narrative from existing engineering intelligence (no new rule engine). */
export function buildExecutiveSummaryNarrative(
  dashboard: RomaQualityDashboard,
  intelligence: RomaEngineeringIntelligence
): string[] {
  const lines: string[] = [];
  const summary = intelligence.ownerSummary;
  const envLabel = dashboard.environment.label || summary.environment;

  lines.push(`${envLabel} is ${dashboard.platformStatus.overallHealthLabel.toLowerCase()}.`);

  if (summary.warningCount > 0) {
    lines.push(
      summary.warningCount === 1
        ? "One warning exists."
        : `${summary.warningCount} warnings exist.`
    );
  } else {
    lines.push("No warnings detected.");
  }

  const aiComponent = findSystemComponent(dashboard, "ai");
  if (aiComponent?.status === "not_configured") {
    lines.push("AI provider is not configured.");
  } else if (aiComponent?.status === "degraded" || aiComponent?.status === "unavailable") {
    lines.push(`AI layer is ${aiComponent.statusLabel.toLowerCase()}.`);
  }

  lines.push(`Release is ${summary.releaseDecisionLabel}.`);

  if (summary.criticalBlockersCount === 0) {
    lines.push("No critical blockers.");
  } else {
    lines.push(
      summary.criticalBlockersCount === 1
        ? "One critical blocker requires attention."
        : `${summary.criticalBlockersCount} critical blockers require attention.`
    );
  }

  if (intelligence.confidencePercent !== null) {
    lines.push(`Estimated confidence ${intelligence.confidencePercent}%.`);
  } else {
    lines.push(`Confidence level: ${summary.confidenceLabel}.`);
  }

  return lines;
}

export type GroupedRisks = {
  critical: DecisionReason[];
  warning: DecisionReason[];
  information: DecisionReason[];
};

export function groupDecisionReasonsBySeverity(reasons: DecisionReason[]): GroupedRisks {
  const grouped: GroupedRisks = { critical: [], warning: [], information: [] };
  for (const reason of reasons) {
    switch (reason.severity) {
      case "critical":
        grouped.critical.push(reason);
        break;
      case "warning":
        grouped.warning.push(reason);
        break;
      case "information":
        grouped.information.push(reason);
        break;
      default:
        grouped.information.push(reason);
        break;
    }
  }
  return grouped;
}

export function formatLastAuditLabel(recentAudits: readonly RomaAuditRunListItem[]): string {
  if (recentAudits.length === 0) return "No saved snapshots";
  return formatTimestamp(recentAudits[0].createdAt);
}

export function formatCurrentBuildLabel(dashboard: RomaQualityDashboard): string {
  const build = dashboard.latestChanges.build;
  if (build) return build.length > 12 ? `${build.slice(0, 7)}…` : build;
  const timelineBuild = dashboard.platformTimeline.find((e) => e.id === "last_build");
  return timelineBuild?.displayValue ?? "Unknown";
}

export function severitySectionTitle(severity: BlockerSeverity): string {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warnings";
    case "information":
      return "Informational";
    default:
      return "Other";
  }
}

export function formatDeployShaForDiagnostics(dashboard: RomaQualityDashboard): string {
  const sha = dashboard.latestChanges.build ?? dashboard.latestChanges.lastCommit;
  return sha ?? "Not available from live probes";
}

export function formatCoverageLabel(percent: number | null): string {
  return formatPercent(percent);
}
