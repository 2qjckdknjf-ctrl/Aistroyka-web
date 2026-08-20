export type ScheduleMilestone = {
  status: string;
  target_date: string;
  title?: string;
};

export type ScheduleLookaheadDays = 7 | 14 | 30;

export type SchedulePartitionKey = "overdue" | "lookahead" | "later" | "done";

export function isMilestoneOverdue(
  status: string,
  targetDate: string,
  todayIso: string,
): boolean {
  return targetDate < todayIso && status !== "done" && status !== "cancelled";
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function parseScheduleLookaheadDays(raw: string | null | undefined): ScheduleLookaheadDays {
  if (raw === "14") return 14;
  if (raw === "30") return 30;
  return 7;
}

export function summarizeScheduleHealth(
  milestones: readonly ScheduleMilestone[],
  todayIso: string,
): { overdue: number; upcoming: number; done: number } {
  let overdue = 0;
  let upcoming = 0;
  let done = 0;
  for (const milestone of milestones) {
    if (milestone.status === "done") {
      done += 1;
      continue;
    }
    if (milestone.status === "cancelled") {
      continue;
    }
    if (isMilestoneOverdue(milestone.status, milestone.target_date, todayIso)) {
      overdue += 1;
      continue;
    }
    upcoming += 1;
  }
  return { overdue, upcoming, done };
}

function sortByTargetDateThenTitle<T extends ScheduleMilestone>(a: T, b: T): number {
  if (a.target_date !== b.target_date) return a.target_date < b.target_date ? -1 : 1;
  return (a.title ?? "").localeCompare(b.title ?? "");
}

/** Phone/tablet schedule IA: overdue → lookahead window → later → done (cancelled omitted). */
export function partitionScheduleMilestones<T extends ScheduleMilestone>(
  milestones: readonly T[],
  todayIso: string,
  lookaheadDays: ScheduleLookaheadDays,
): Record<SchedulePartitionKey, T[]> {
  const lookaheadEnd = addDaysIso(todayIso, lookaheadDays);
  const buckets: Record<SchedulePartitionKey, T[]> = {
    overdue: [],
    lookahead: [],
    later: [],
    done: [],
  };

  for (const milestone of milestones) {
    if (milestone.status === "cancelled") continue;
    if (milestone.status === "done") {
      buckets.done.push(milestone);
      continue;
    }
    if (isMilestoneOverdue(milestone.status, milestone.target_date, todayIso)) {
      buckets.overdue.push(milestone);
      continue;
    }
    if (milestone.target_date <= lookaheadEnd) {
      buckets.lookahead.push(milestone);
      continue;
    }
    buckets.later.push(milestone);
  }

  for (const key of Object.keys(buckets) as SchedulePartitionKey[]) {
    buckets[key] = [...buckets[key]].sort(sortByTargetDateThenTitle);
  }
  return buckets;
}

/** Compact 7-day density strip (not a Gantt): count open milestones due each day. */
export function buildLookaheadDayStrip(
  milestones: readonly ScheduleMilestone[],
  todayIso: string,
  days = 7,
): Array<{ date: string; count: number }> {
  const strip: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(todayIso, i);
    const count = milestones.filter(
      (m) =>
        m.target_date === date &&
        m.status !== "done" &&
        m.status !== "cancelled",
    ).length;
    strip.push({ date, count });
  }
  return strip;
}
