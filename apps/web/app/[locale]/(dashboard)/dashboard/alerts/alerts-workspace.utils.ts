/** Alerts workspace helpers — severity / status density (canonical redesign). */

export type AlertStatusFilter = "all" | "unresolved" | "resolved";

export type AlertSeverityFilter = "all" | "critical" | "warn" | "info";

export type AlertWorkspaceItem = {
  id: string;
  severity: string;
  created_at: string;
  resolved_at: string | null;
};

export function parseAlertStatusFilter(raw: string | null | undefined): AlertStatusFilter {
  if (raw === "unresolved" || raw === "resolved") return raw;
  return "all";
}

export function parseAlertSeverityFilter(raw: string | null | undefined): AlertSeverityFilter {
  if (raw === "critical" || raw === "warn" || raw === "info") return raw;
  return "all";
}

export function normalizeAlertSeverity(raw: string): Exclude<AlertSeverityFilter, "all"> {
  switch (raw) {
    case "critical":
      return "critical";
    case "warn":
    case "warning":
      return "warn";
    default:
      return "info";
  }
}

export function isAlertUnresolved(item: { resolved_at: string | null }): boolean {
  return item.resolved_at == null;
}

export function filterAlertsByStatus<T extends { resolved_at: string | null }>(
  items: readonly T[],
  filter: AlertStatusFilter,
): T[] {
  switch (filter) {
    case "all":
      return [...items];
    case "unresolved":
      return items.filter((item) => isAlertUnresolved(item));
    case "resolved":
      return items.filter((item) => !isAlertUnresolved(item));
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function filterAlertsBySeverity<T extends { severity: string }>(
  items: readonly T[],
  filter: AlertSeverityFilter,
): T[] {
  if (filter === "all") return [...items];
  return items.filter((item) => normalizeAlertSeverity(item.severity) === filter);
}

export function countAlertsByStatus(
  items: ReadonlyArray<{ resolved_at: string | null }>,
): Record<AlertStatusFilter, number> {
  const counts: Record<AlertStatusFilter, number> = {
    all: items.length,
    unresolved: 0,
    resolved: 0,
  };
  for (const item of items) {
    if (isAlertUnresolved(item)) counts.unresolved += 1;
    else counts.resolved += 1;
  }
  return counts;
}

export function countAlertsBySeverity(
  items: ReadonlyArray<{ severity: string }>,
): Record<AlertSeverityFilter, number> {
  const counts: Record<AlertSeverityFilter, number> = {
    all: items.length,
    critical: 0,
    warn: 0,
    info: 0,
  };
  for (const item of items) {
    counts[normalizeAlertSeverity(item.severity)] += 1;
  }
  return counts;
}

function severityWeight(severity: string): number {
  const normalized = normalizeAlertSeverity(severity);
  switch (normalized) {
    case "critical":
      return 3;
    case "warn":
      return 2;
    case "info":
      return 1;
    default: {
      const _exhaustive: never = normalized;
      return _exhaustive;
    }
  }
}

/** Unresolved first, then higher severity, then newest. */
export function sortAlertsByAttention<T extends AlertWorkspaceItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const aOpen = isAlertUnresolved(a) ? 0 : 1;
    const bOpen = isAlertUnresolved(b) ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    const sev = severityWeight(b.severity) - severityWeight(a.severity);
    if (sev !== 0) return sev;
    if (a.created_at === b.created_at) return 0;
    return a.created_at < b.created_at ? 1 : -1;
  });
}
