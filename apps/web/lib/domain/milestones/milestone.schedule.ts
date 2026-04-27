/**
 * Explainable schedule signals for project milestones (no CPM / fake prediction).
 * Uses milestone row + linked task completion counts + calendar dates only.
 */

import type { MilestoneStatus } from "./milestone.types";

export type ScheduleSignalCode =
  | "milestone_overdue"
  | "milestone_due_soon"
  | "milestone_incomplete_tasks_past_target"
  | "milestone_no_linked_tasks"
  | "milestone_delayed_status";

export interface ScheduleSignal {
  code: ScheduleSignalCode;
  /** Human-readable, safe to show managers. */
  reason: string;
}

const ACTIVE: MilestoneStatus[] = ["planned", "in_progress", "delayed"];

function isActiveStatus(status: string): status is MilestoneStatus {
  return ACTIVE.includes(status as MilestoneStatus);
}

export interface MilestoneScheduleInput {
  target_date: string;
  status: string;
}

export interface LinkedTaskCounts {
  total: number;
  done: number;
}

const DUE_SOON_DAYS = 7;

/** Build ordered, non-duplicative signals for a milestone row + task linkage. */
export function buildMilestoneScheduleSignals(
  milestone: MilestoneScheduleInput,
  linked: LinkedTaskCounts,
  todayIso: string = new Date().toISOString().slice(0, 10)
): ScheduleSignal[] {
  const signals: ScheduleSignal[] = [];
  const { target_date: target, status } = milestone;

  if (status === "completed" || status === "archived") {
    return [];
  }

  if (status === "delayed") {
    signals.push({
      code: "milestone_delayed_status",
      reason: "Milestone marked delayed — review target date and linked tasks.",
    });
  }

  const incomplete = linked.total > 0 ? linked.total - linked.done : 0;
  const overdue = target < todayIso && isActiveStatus(status);
  const dueSoon =
    !overdue && target >= todayIso && target <= addDaysIso(todayIso, DUE_SOON_DAYS) && isActiveStatus(status);

  if (linked.total === 0 && isActiveStatus(status)) {
    signals.push({
      code: "milestone_no_linked_tasks",
      reason: "No tasks linked to this milestone — schedule may be undefined.",
    });
  }

  if (overdue && incomplete > 0) {
    signals.push({
      code: "milestone_incomplete_tasks_past_target",
      reason: `Target date ${target} has passed with ${incomplete} incomplete linked task(s).`,
    });
  } else if (overdue) {
    signals.push({
      code: "milestone_overdue",
      reason: `Target date ${target} is before today (${todayIso}).`,
    });
  }

  if (dueSoon) {
    signals.push({
      code: "milestone_due_soon",
      reason: `Target ${target} is within the next ${DUE_SOON_DAYS} days.`,
    });
  }

  return dedupeSignals(signals);
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dedupeSignals(signals: ScheduleSignal[]): ScheduleSignal[] {
  const seen = new Set<ScheduleSignalCode>();
  const out: ScheduleSignal[] = [];
  for (const s of signals) {
    if (seen.has(s.code)) continue;
    seen.add(s.code);
    out.push(s);
  }
  return out;
}

/** Simple progress label for UI (0–100). */
export function milestoneTaskProgressPercent(linked: LinkedTaskCounts): number {
  if (linked.total <= 0) return 0;
  return Math.round((linked.done / linked.total) * 100);
}
