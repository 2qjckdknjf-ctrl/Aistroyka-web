import type { RecurringRuleKind } from "./recurring-operations.types";

const TITLES: Record<RecurringRuleKind, string> = {
  handover_blocked_followup: "Handover blocked",
  blocking_defects_followup: "Blocking punch list",
  stale_discussion_manager: "Stale discussion (awaiting manager)",
  aftercare_open_review: "Aftercare / warranty open",
};

export function humanRuleLabel(kind: RecurringRuleKind): string {
  return TITLES[kind] ?? kind;
}

export function notificationTypeForKind(kind: RecurringRuleKind): string {
  return `recurring_ops_${kind}`;
}
