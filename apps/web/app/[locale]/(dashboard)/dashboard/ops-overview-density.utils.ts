/** Overview phone-density helpers — Surface A (canonical redesign). */

export type OpsKpiAttentionTier = "primary" | "secondary";

/** Attention-first KPIs for phone density strip (actionable delay / risk). */
export const OPS_PHONE_PRIMARY_KPI_KEYS = [
  "kpiTasksOverdue",
  "kpiStuckUploads",
  "kpiOfflineDevices",
  "kpiFailedJobs",
  "kpiTasksOpenToday",
  "kpiReportsToday",
] as const;

export type OpsPhonePrimaryKpiKey = (typeof OPS_PHONE_PRIMARY_KPI_KEYS)[number];

export function opsKpiAttentionTier(labelKey: string): OpsKpiAttentionTier {
  return (OPS_PHONE_PRIMARY_KPI_KEYS as readonly string[]).includes(labelKey)
    ? "primary"
    : "secondary";
}

export function partitionOpsKpisForPhoneDensity<T extends { labelKey: string }>(
  cards: readonly T[],
): { primary: T[]; secondary: T[] } {
  const primary: T[] = [];
  const secondary: T[] = [];
  for (const card of cards) {
    if (opsKpiAttentionTier(card.labelKey) === "primary") {
      primary.push(card);
    } else {
      secondary.push(card);
    }
  }
  return { primary, secondary };
}

export type OpsQueueDensityId =
  | "reportsPendingReview"
  | "stuckUploads"
  | "workersOpenShift"
  | "workersOpenShiftNoReportToday"
  | "aiFailed"
  | "tasksOpenToday"
  | "tasksOverdue"
  | "pushFailed";

/** Higher = more urgent for phone ordering (non-empty queues float up). */
const QUEUE_ATTENTION_WEIGHT: Record<OpsQueueDensityId, number> = {
  tasksOverdue: 100,
  aiFailed: 90,
  stuckUploads: 80,
  reportsPendingReview: 70,
  workersOpenShiftNoReportToday: 60,
  tasksOpenToday: 50,
  workersOpenShift: 40,
  pushFailed: 30,
};

export function opsQueueItemCount(items: readonly unknown[] | null | undefined): number {
  return items?.length ?? 0;
}

export function sortOpsQueuesByPhoneDensity<T extends { id: OpsQueueDensityId; count: number }>(
  queues: readonly T[],
): T[] {
  return [...queues].sort((a, b) => {
    const aEmpty = a.count === 0 ? 1 : 0;
    const bEmpty = b.count === 0 ? 1 : 0;
    if (aEmpty !== bEmpty) return aEmpty - bEmpty;
    const weightDelta = QUEUE_ATTENTION_WEIGHT[b.id] - QUEUE_ATTENTION_WEIGHT[a.id];
    if (weightDelta !== 0) return weightDelta;
    return b.count - a.count;
  });
}

/** Phone: hide empty queues; desktop can still show status empties. */
export function filterOpsQueuesForPhoneDensity<T extends { count: number }>(
  queues: readonly T[],
  opts: { phone: boolean },
): T[] {
  if (!opts.phone) return [...queues];
  return queues.filter((q) => q.count > 0);
}

export function limitManagerActionsForPhoneDensity<T>(
  items: readonly T[],
  opts: { phone: boolean; limit?: number },
): { visible: T[]; hiddenCount: number } {
  if (!opts.phone) return { visible: [...items], hiddenCount: 0 };
  const limit = opts.limit ?? 3;
  if (items.length <= limit) return { visible: [...items], hiddenCount: 0 };
  return { visible: items.slice(0, limit), hiddenCount: items.length - limit };
}
