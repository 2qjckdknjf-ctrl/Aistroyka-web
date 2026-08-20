/** AI requests workspace helpers — status density chrome. */

export type AiRequestStatus = "queued" | "running" | "success" | "failed" | "dead";

export type AiStatusFilter = "all" | AiRequestStatus;

export const AI_STATUS_ORDER: AiRequestStatus[] = [
  "failed",
  "dead",
  "running",
  "queued",
  "success",
];

export function parseAiStatusFilter(raw: string | null | undefined): AiStatusFilter {
  if (
    raw === "queued" ||
    raw === "running" ||
    raw === "success" ||
    raw === "failed" ||
    raw === "dead"
  ) {
    return raw;
  }
  return "all";
}

export type AiSummaryCounts = {
  total: number;
  queued: number;
  running: number;
  success: number;
  failed: number;
  dead: number;
};

export function aiSummaryChipOrder(summary: AiSummaryCounts): Array<{
  status: AiRequestStatus;
  count: number;
}> {
  return AI_STATUS_ORDER.map((status) => ({
    status,
    count: summary[status],
  })).filter((chip) => chip.count > 0 || statusNeedsAlwaysShow(chip.status, summary));
}

function statusNeedsAlwaysShow(status: AiRequestStatus, summary: AiSummaryCounts): boolean {
  switch (status) {
    case "failed":
    case "dead":
    case "running":
      return summary.total > 0;
    case "queued":
    case "success":
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Attention-first: failed/dead → running → queued → success. */
export function sortAiRequestsByAttention<
  T extends { status: string; updated_at: string; id: string },
>(items: readonly T[]): T[] {
  const weight = (status: string): number => {
    switch (status) {
      case "failed":
        return 5;
      case "dead":
        return 4;
      case "running":
        return 3;
      case "queued":
        return 2;
      case "success":
        return 1;
      default:
        return 0;
    }
  };
  return [...items].sort((a, b) => {
    const delta = weight(b.status) - weight(a.status);
    if (delta !== 0) return delta;
    if (a.updated_at === b.updated_at) return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    return a.updated_at < b.updated_at ? 1 : -1;
  });
}
