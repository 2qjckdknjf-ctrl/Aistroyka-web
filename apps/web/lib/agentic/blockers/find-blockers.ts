/**
 * Blocker detection v1 — only verified production signals.
 * Does not invent task dependencies (no dependency table in production schema).
 */

import type { AgentEvidenceType } from "../contracts/evidence.types";

export type BlockerKind =
  | "overdue_critical_task"
  | "blocked_task"
  | "critical_unresolved_issue"
  | "required_evidence_missing"
  | "stale_manager_review";

export interface ProjectBlocker {
  kind: BlockerKind;
  title: string;
  why: string;
  sourceEntityType: string;
  sourceEntityId: string;
  evidenceType: AgentEvidenceType;
}

export interface BlockerInputs {
  taskSignals: Array<{
    taskId: string;
    type: string;
    severity: string;
    message: string;
  }>;
  defects: Array<{
    id: string;
    title: string;
    status: string;
    isBlocking: boolean;
  }>;
  missingEvidence: Array<{
    id: string;
    resourceType?: string;
    resourceId?: string;
    explanation?: string;
  }>;
}

export function findProjectBlockers(input: BlockerInputs): ProjectBlocker[] {
  const blockers: ProjectBlocker[] = [];

  for (const t of input.taskSignals) {
    if (t.type === "blocked") {
      blockers.push({
        kind: "blocked_task",
        title: t.message,
        why: "Inferred blocked: overdue, in progress, no recent report (no dependency graph in schema).",
        sourceEntityType: "worker_tasks",
        sourceEntityId: t.taskId,
        evidenceType: "TASK",
      });
    } else if (t.type === "overdue" && t.severity === "high") {
      blockers.push({
        kind: "overdue_critical_task",
        title: t.message,
        why: "Task due date is in the past and still open.",
        sourceEntityType: "worker_tasks",
        sourceEntityId: t.taskId,
        evidenceType: "TASK",
      });
    }
  }

  for (const d of input.defects) {
    if (d.isBlocking && !["resolved", "closed"].includes(d.status)) {
      blockers.push({
        kind: "critical_unresolved_issue",
        title: d.title,
        why: "Punch-list item marked blocking and not resolved.",
        sourceEntityType: "project_defects",
        sourceEntityId: d.id,
        evidenceType: "ISSUE",
      });
    }
  }

  for (const m of input.missingEvidence) {
    if (!m.resourceId) continue;
    blockers.push({
      kind: "required_evidence_missing",
      title: m.explanation ?? "Required evidence missing",
      why: "Evidence gap reported by existing evidence intelligence.",
      sourceEntityType: m.resourceType ?? "unknown",
      sourceEntityId: m.resourceId,
      evidenceType: "TASK",
    });
  }

  return blockers;
}
