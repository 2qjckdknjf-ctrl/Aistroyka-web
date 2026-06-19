/**
 * Code-backed workflow readiness inventory for LG-4.6 public /workflows page.
 * Status values must match evidence in docs/design/LG46_WORKFLOWS_* audits.
 */

export type PublicWorkflowReadiness = "live" | "partial" | "planned";

export const PUBLIC_WORKFLOW_PATHS = [
  { key: "pathIssueNotify", readiness: "partial", highlight: true },
  { key: "pathOverdueFollowup", readiness: "partial", highlight: false },
  { key: "pathMissingEvidence", readiness: "partial", highlight: false },
  { key: "pathReportAnalysis", readiness: "partial", highlight: false },
  { key: "pathRiskAlert", readiness: "planned", highlight: false },
] as const satisfies ReadonlyArray<{
  key: string;
  readiness: PublicWorkflowReadiness;
  highlight: boolean;
}>;

export const PUBLIC_WORKFLOW_TIMELINE_KEYS = [
  { key: "stepSignal", readiness: "partial" as const },
  { key: "stepRoute", readiness: "partial" as const },
  { key: "stepReview", readiness: "live" as const },
  { key: "stepAutomate", readiness: "planned" as const },
  { key: "stepAudit", readiness: "live" as const },
] as const;

export const PUBLIC_WORKFLOW_LIVE_KEYS = [
  "liveManualReview",
  "liveManagerNotifications",
  "liveIssueRecords",
  "liveReportQueues",
  "liveProjectRecords",
] as const;

export const PUBLIC_WORKFLOW_ROADMAP_KEYS = [
  { key: "roadmapWorkflowTriggers", readiness: "partial" as const },
  { key: "roadmapAutoReminders", readiness: "partial" as const },
  { key: "roadmapRiskAlerting", readiness: "planned" as const },
  { key: "roadmapOutboundEscalation", readiness: "planned" as const },
  { key: "roadmapAutomationEngine", readiness: "planned" as const },
] as const;

export function publicWorkflowStatusKey(
  readiness: PublicWorkflowReadiness,
): "statusLive" | "statusPartial" | "statusPlanned" {
  switch (readiness) {
    case "live":
      return "statusLive";
    case "partial":
      return "statusPartial";
    case "planned":
      return "statusPlanned";
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}
