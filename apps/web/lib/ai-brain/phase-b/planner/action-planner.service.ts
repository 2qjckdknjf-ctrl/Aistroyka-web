/**
 * AI Brain Phase B — Action planner service.
 * Transforms snapshot + mode into safe AiActionDraft proposals. No execution.
 */

import type { ProjectTruthSnapshot } from "@/lib/ai-brain/phase-a";
import type { OrchestratorMode } from "@/lib/ai-brain/phase-a";
import type { AiActionDraft, AiActionType } from "../actions";
import { evaluateActionPolicy } from "../policy";
import type { RunContextRole } from "../policy";

function nextActionId(): string {
  return `ai-action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface PlannerInput {
  snapshot: ProjectTruthSnapshot;
  mode: OrchestratorMode;
  userRole: RunContextRole;
  userId?: string;
  runId?: string;
  userRequest?: string;
}

export interface PlannerResult {
  drafts: AiActionDraft[];
  degraded: boolean;
  degradedReason?: string;
}

export function planActions(input: PlannerInput): PlannerResult {
  const { snapshot, mode, userRole, userId, runId } = input;
  const drafts: AiActionDraft[] = [];
  const at = new Date().toISOString();

  const propose = (
    actionType: AiActionType,
    title: string,
    rationale: string,
    factsUsed: string[],
    inferredReasoning: string,
    targetRefs: AiActionDraft["targetEntityRefs"],
    payload: Record<string, unknown>
  ): void => {
    const policyResult = evaluateActionPolicy({
      actionType,
      userRole,
      tenantId: snapshot.tenantId,
      projectId: snapshot.projectId,
      mode,
      snapshot,
    });

    if (policyResult.policy === "forbidden") return;
    if (policyResult.policy === "unavailable_due_to_partial_module") return;

    drafts.push({
      actionId: nextActionId(),
      tenantId: snapshot.tenantId,
      projectId: snapshot.projectId,
      requestedBy: userId,
      mode,
      actionType,
      riskLevel: policyResult.riskLevel,
      requiresApproval: policyResult.requiresApproval,
      status: policyResult.requiresApproval ? "pending_approval" : "draft_ready",
      title,
      rationale,
      factsUsed,
      inferredReasoningSummary: inferredReasoning,
      targetEntityRefs: targetRefs,
      payload,
      availabilityFlags: { snapshot: true },
      warnings: policyResult.unavailableReason ? [policyResult.unavailableReason] : [],
      createdAt: at,
      provenance: { mode, runId, snapshotAt: snapshot.at },
    });
  };

  switch (mode) {
    case "executive_summary":
      if (snapshot.topRisksSummary.highCount > 0) {
        propose(
          "draft_manager_escalation",
          "Review high-priority risks",
          `${snapshot.topRisksSummary.highCount} high-priority risk(s) require attention`,
          ["topRisksSummary"],
          "Executive summary mode recommends escalation when high risks present",
          [],
          { riskCount: snapshot.topRisksSummary.highCount }
        );
      }
      if (snapshot.missingEvidenceSummary.count > 0) {
        propose(
          "draft_request_more_evidence",
          "Address evidence gaps",
          `${snapshot.missingEvidenceSummary.count} evidence gap(s) detected`,
          ["missingEvidenceSummary"],
          "Missing evidence may affect project health assessment",
          [],
          { gapCount: snapshot.missingEvidenceSummary.count }
        );
      }
      break;

    case "manager_assist":
      if (snapshot.openTaskCounts.overdue > 0) {
        propose(
          "draft_followup_task",
          "Follow up on overdue tasks",
          `${snapshot.openTaskCounts.overdue} overdue task(s)`,
          ["openTaskCounts"],
          "Overdue tasks suggest follow-up action",
          [],
          { overdueCount: snapshot.openTaskCounts.overdue }
        );
      }
      if (snapshot.approvalPressure.pendingCount > 0) {
        propose(
          "draft_approval_followup",
          "Review pending approvals",
          `${snapshot.approvalPressure.pendingCount} document(s) awaiting decision`,
          ["approvalPressure"],
          "Documents under review need attention",
          [],
          { pendingCount: snapshot.approvalPressure.pendingCount }
        );
      }
      if (snapshot.documentPressure.underReviewCount > 0 && snapshot.approvalPressure.available) {
        propose(
          "draft_document_followup",
          "Follow up on documents under review",
          `${snapshot.documentPressure.underReviewCount} document(s) under review`,
          ["documentPressure"],
          "Document review cycle may need follow-up",
          [],
          { underReviewCount: snapshot.documentPressure.underReviewCount }
        );
      }
      if (snapshot.missingEvidenceSummary.count > 0) {
        propose(
          "draft_request_more_evidence",
          "Request additional evidence",
          `${snapshot.missingEvidenceSummary.count} evidence gap(s)`,
          ["missingEvidenceSummary"],
          "Evidence gaps may require worker follow-up",
          [],
          { gapCount: snapshot.missingEvidenceSummary.count }
        );
      }
      break;

    case "worker_assist":
      if (snapshot.missingEvidenceSummary.count > 0) {
        propose(
          "draft_request_more_evidence",
          "Complete evidence for tasks",
          `${snapshot.missingEvidenceSummary.count} evidence gap(s) on assigned tasks`,
          ["missingEvidenceSummary"],
          "Worker mode: evidence gaps on tasks need attention",
          [],
          { gapCount: snapshot.missingEvidenceSummary.count }
        );
      }
      if (snapshot.reportFreshness === "stale" || snapshot.reportFreshness === "none") {
        propose(
          "draft_report_review_note",
          "Submit report",
          "Reports may be missing or stale",
          ["reportFreshness"],
          "Report freshness indicates action needed",
          [],
          { reportFreshness: snapshot.reportFreshness }
        );
      }
      break;

    case "project_intelligence":
      if (snapshot.topRisksSummary.highCount > 0) {
        propose(
          "draft_manager_escalation",
          "Escalate high risks",
          `${snapshot.topRisksSummary.highCount} high-priority risk(s)`,
          ["topRisksSummary"],
          "Project intelligence flags escalation for high risks",
          [],
          { riskCount: snapshot.topRisksSummary.highCount }
        );
      }
      break;

    case "client_safe_summary":
      propose(
        "draft_client_update",
        "Project status summary",
        `Project status: ${snapshot.projectStatus}`,
        ["projectStatus", "health"],
        "Client-safe summary prepared for external sharing",
        [],
        { projectStatus: snapshot.projectStatus }
      );
      break;

    default:
      break;
  }

  return { drafts, degraded: false };
}
