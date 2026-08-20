import type { ClientVisibleMilestone } from "./client-portal.types";

const CLOSED_MILESTONE_STATUSES = new Set(["done", "cancelled", "completed"]);

/** Soonest incomplete customer-visible milestone (includes overdue). */
export function pickNextClientMilestone(
  milestones: readonly ClientVisibleMilestone[],
): ClientVisibleMilestone | null {
  const open = milestones.filter((m) => !CLOSED_MILESTONE_STATUSES.has(m.status));
  if (open.length === 0) return null;
  const sorted = [...open].sort((a, b) => {
    if (a.target_date !== b.target_date) return a.target_date < b.target_date ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return sorted[0] ?? null;
}
