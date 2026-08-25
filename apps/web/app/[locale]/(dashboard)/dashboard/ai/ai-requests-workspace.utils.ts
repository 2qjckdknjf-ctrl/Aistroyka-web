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

export type AiHeatmapCell = { level: number; label: string };

const HEATMAP_STATUSES: AiRequestStatus[] = ["failed", "dead", "running", "queued", "success"];

function heatmapLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio >= 0.85) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.35) return 2;
  return 1;
}

/** 5×5 matrix: job type (columns) × status (rows) from live tenant AI requests. */
export function buildAiRiskHeatmapFromRequests(
  rows: readonly { type: string; status: string }[],
): AiHeatmapCell[] {
  const typeOrder = [...new Set(rows.map((r) => r.type || "unknown"))].slice(0, 5);
  while (typeOrder.length < 5) typeOrder.push("—");

  const counts: number[][] = HEATMAP_STATUSES.map(() => typeOrder.map(() => 0));
  for (const row of rows) {
    const col = typeOrder.indexOf(row.type || "unknown");
    const rowIdx = HEATMAP_STATUSES.indexOf(row.status as AiRequestStatus);
    if (col >= 0 && col < 5 && rowIdx >= 0) {
      counts[rowIdx][col] += 1;
    }
  }

  const max = Math.max(...counts.flat(), 1);
  const cells: AiHeatmapCell[] = [];
  for (let rowIdx = 0; rowIdx < 5; rowIdx += 1) {
    for (let col = 0; col < 5; col += 1) {
      const count = counts[rowIdx][col];
      const typeLabel = typeOrder[col] === "—" ? "—" : typeOrder[col];
      cells.push({
        level: heatmapLevel(count, max),
        label: `${typeLabel} · ${HEATMAP_STATUSES[rowIdx]} (${count})`,
      });
    }
  }
  return cells;
}

export type AiWavePoint = { key: string; label: string; total: number; risk: number };

/** Daily AI job volume (total + failed/dead) for the portfolio wave chart. */
export function buildAiWavePointsFromRequests(
  rows: readonly { created_at: string; status: string }[],
  days = 14,
): AiWavePoint[] {
  const buckets: AiWavePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      total: 0,
      risk: 0,
    });
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.status === "failed" || row.status === "dead") bucket.risk += 1;
  }

  return buckets;
}

export function buildAiRecommendationKeys(summary: AiSummaryCounts): string[] {
  const keys: string[] = [];
  if (summary.failed > 0) keys.push("aiRecFailedCount");
  if (summary.dead > 0) keys.push("aiRecDeadCount");
  if (summary.queued + summary.running > 0) keys.push("aiRecQueueCount");
  if (summary.success > 0 && summary.total > 0 && summary.success / summary.total >= 0.9) {
    keys.push("aiRecHealthy");
  }
  if (keys.length === 0) keys.push("aiRecSchedule", "aiRecBudget", "aiRecResources");
  return keys.slice(0, 3);
}
