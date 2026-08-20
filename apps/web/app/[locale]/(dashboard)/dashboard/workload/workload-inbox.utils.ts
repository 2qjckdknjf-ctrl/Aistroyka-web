/** Workload inbox helpers — priority density (canonical redesign). */

import type { WorkloadPriority } from "@/lib/domain/workload/workload.types";

export type WorkloadPriorityFilter = "all" | WorkloadPriority;

export function parseWorkloadPriorityFilter(
  raw: string | null | undefined,
): WorkloadPriorityFilter {
  if (raw === "urgent" || raw === "high" || raw === "normal") return raw;
  return "all";
}

export function filterWorkloadByPriority<T extends { priority: WorkloadPriority }>(
  items: readonly T[],
  filter: WorkloadPriorityFilter,
): T[] {
  if (filter === "all") return [...items];
  return items.filter((item) => item.priority === filter);
}

export function countWorkloadByPriority(
  items: ReadonlyArray<{ priority: WorkloadPriority }>,
): Record<WorkloadPriorityFilter, number> {
  const counts: Record<WorkloadPriorityFilter, number> = {
    all: items.length,
    urgent: 0,
    high: 0,
    normal: 0,
  };
  for (const item of items) {
    counts[item.priority] += 1;
  }
  return counts;
}

function priorityWeight(priority: WorkloadPriority): number {
  switch (priority) {
    case "urgent":
      return 3;
    case "high":
      return 2;
    case "normal":
      return 1;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

/** Urgent → high → normal (stable within band). */
export function sortWorkloadByPriority<T extends { priority: WorkloadPriority; id: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => {
    const delta = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (delta !== 0) return delta;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
