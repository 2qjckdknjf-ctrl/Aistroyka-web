import { addDaysIso, isMilestoneOverdue, type ScheduleMilestone } from "./schedule-health";

export type GanttMonthHeader = {
  key: string;
  label: string;
  leftPercent: number;
  widthPercent: number;
};

export type GanttBarLayout = {
  id: string;
  title: string;
  status: string;
  targetDate: string;
  startDate: string;
  endDate: string;
  leftPercent: number;
  widthPercent: number;
  overdue: boolean;
};

export type GanttRange = {
  start: string;
  end: string;
  totalDays: number;
};

export function daysBetweenIso(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T12:00:00.000Z`);
  const end = new Date(`${endIso}T12:00:00.000Z`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function computeGanttRange(
  milestones: readonly ScheduleMilestone[],
  todayIso: string,
  paddingDays = 14,
): GanttRange {
  const active = milestones.filter((m) => m.status !== "cancelled");
  if (active.length === 0) {
    const start = addDaysIso(todayIso, -paddingDays);
    const end = addDaysIso(todayIso, 90);
    return { start, end, totalDays: daysBetweenIso(start, end) };
  }

  let minDate = active[0].target_date;
  let maxDate = active[0].target_date;
  for (const milestone of active) {
    if (milestone.target_date < minDate) minDate = milestone.target_date;
    if (milestone.target_date > maxDate) maxDate = milestone.target_date;
  }

  const start = addDaysIso(minDate, -paddingDays);
  const end = addDaysIso(maxDate, paddingDays);
  const totalDays = Math.max(1, daysBetweenIso(start, end));
  return { start, end, totalDays };
}

export function buildGanttBars<T extends ScheduleMilestone & { id: string }>(
  milestones: readonly T[],
  range: GanttRange,
  todayIso: string,
): GanttBarLayout[] {
  const sorted = [...milestones]
    .filter((m) => m.status !== "cancelled")
    .sort((a, b) => {
      if (a.target_date !== b.target_date) return a.target_date < b.target_date ? -1 : 1;
      return (a.title ?? "").localeCompare(b.title ?? "");
    });

  return sorted.map((milestone, index) => {
    const prevTarget = index > 0 ? sorted[index - 1].target_date : addDaysIso(milestone.target_date, -7);
    const startDate = prevTarget < range.start ? range.start : prevTarget;
    const endDate = milestone.target_date;
    const clampedStart = startDate < range.start ? range.start : startDate;
    const clampedEnd = endDate > range.end ? range.end : endDate;
    const leftDays = daysBetweenIso(range.start, clampedStart);
    const spanDays = Math.max(1, daysBetweenIso(clampedStart, clampedEnd));
    const leftPercent = (leftDays / range.totalDays) * 100;
    const widthPercent = Math.max(2.5, (spanDays / range.totalDays) * 100);

    return {
      id: milestone.id,
      title: milestone.title ?? "Milestone",
      status: milestone.status,
      targetDate: milestone.target_date,
      startDate: clampedStart,
      endDate: clampedEnd,
      leftPercent,
      widthPercent,
      overdue: isMilestoneOverdue(milestone.status, milestone.target_date, todayIso),
    };
  });
}

export function buildGanttMonthHeaders(range: GanttRange): GanttMonthHeader[] {
  const headers: GanttMonthHeader[] = [];
  let cursor = range.start.slice(0, 7);
  const endMonth = range.end.slice(0, 7);

  while (cursor <= endMonth) {
    const monthStart = cursor.length === 7 ? `${cursor}-01` : cursor;
    const nextMonth = new Date(`${monthStart}T12:00:00.000Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const nextIso = nextMonth.toISOString().slice(0, 10);
    const segmentStart = monthStart < range.start ? range.start : monthStart;
    const segmentEnd = nextIso > range.end ? range.end : nextIso;
    const leftPercent = (daysBetweenIso(range.start, segmentStart) / range.totalDays) * 100;
    const widthPercent = (daysBetweenIso(segmentStart, segmentEnd) / range.totalDays) * 100;
    const labelDate = new Date(`${monthStart}T12:00:00.000Z`);

    headers.push({
      key: cursor,
      label: labelDate.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      leftPercent,
      widthPercent: Math.max(widthPercent, 4),
    });

    cursor = nextIso.slice(0, 7);
    if (headers.length > 24) break;
  }

  return headers;
}

export function todayMarkerPercent(range: GanttRange, todayIso: string): number | null {
  if (todayIso < range.start || todayIso > range.end) return null;
  return (daysBetweenIso(range.start, todayIso) / range.totalDays) * 100;
}

export function computeScheduleCompletionPercent(milestones: readonly ScheduleMilestone[]): number {
  const relevant = milestones.filter((m) => m.status !== "cancelled");
  if (relevant.length === 0) return 0;
  const done = relevant.filter((m) => m.status === "done").length;
  return Math.round((done / relevant.length) * 100);
}

export function projectedScheduleEnd(
  milestones: readonly ScheduleMilestone[],
  todayIso: string,
): string | null {
  const open = milestones.filter((m) => m.status !== "done" && m.status !== "cancelled");
  if (open.length === 0) return null;
  let max = open[0].target_date;
  for (const milestone of open) {
    if (milestone.target_date > max) max = milestone.target_date;
  }
  return max >= todayIso ? max : todayIso;
}
