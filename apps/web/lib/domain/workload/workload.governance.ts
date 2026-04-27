import type { WorkloadDueState, WorkloadPriority, WorkloadStatusBucket } from "./workload.types";

export function priorityForManagerSignal(input: {
  blockingDefects: number;
  budgetOverBudget: boolean;
  handoverBlockerCount: number;
  overdueMilestones: number;
  pendingDecisions: number;
  aftercareOpen: number;
}): WorkloadPriority {
  if (input.budgetOverBudget || input.blockingDefects > 0) return "urgent";
  if (input.handoverBlockerCount >= 3 || input.overdueMilestones >= 3) return "urgent";
  if (input.pendingDecisions >= 2 || input.aftercareOpen >= 3) return "high";
  if (input.overdueMilestones > 0 || input.handoverBlockerCount > 0) return "high";
  return "normal";
}

export function dueStateForManager(kind: string, overdueMilestones: number, blockingDefects: number): WorkloadDueState {
  if (kind === "blocking_punch_defects" && blockingDefects > 0) return "blocking";
  if (kind === "overdue_milestones" && overdueMilestones > 0) return "overdue";
  if (kind === "handover_not_ready") return "blocking";
  return "waiting_on_team";
}

export function statusBucketFor(priority: WorkloadPriority): WorkloadStatusBucket {
  if (priority === "urgent") return "risk";
  if (priority === "high") return "action_needed";
  return "review";
}

export function priorityStakeholder(): WorkloadPriority {
  return "high";
}

export function dueStateStakeholder(): WorkloadDueState {
  return "waiting_on_you";
}
