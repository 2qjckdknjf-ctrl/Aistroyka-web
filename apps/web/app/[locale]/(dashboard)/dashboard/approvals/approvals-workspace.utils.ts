/** Approvals inbox helpers — decision queue chrome (canonical redesign). */

export type ApprovalKind = "report" | "document";

export type ApprovalKindFilter = "all" | ApprovalKind;

export type PendingApprovalItem = {
  kind: ApprovalKind;
  id: string;
  pending_at: string;
};

export function parseApprovalKindFilter(raw: string | null | undefined): ApprovalKindFilter {
  if (raw === "report" || raw === "document") return raw;
  return "all";
}

export function filterApprovalsByKind<T extends { kind: ApprovalKind }>(
  items: readonly T[],
  filter: ApprovalKindFilter,
): T[] {
  if (filter === "all") return [...items];
  return items.filter((item) => item.kind === filter);
}

export function countApprovalsByKind(
  items: ReadonlyArray<{ kind: ApprovalKind }>,
): Record<ApprovalKindFilter, number> {
  const counts: Record<ApprovalKindFilter, number> = {
    all: items.length,
    report: 0,
    document: 0,
  };
  for (const item of items) {
    counts[item.kind] += 1;
  }
  return counts;
}

/** Oldest pending first — actionable delay priority. */
export function sortApprovalsOldestFirst<T extends { pending_at: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.pending_at === b.pending_at) return 0;
    return a.pending_at < b.pending_at ? -1 : 1;
  });
}

export function approvalHref(item: {
  kind: ApprovalKind;
  id: string;
  project_id: string | null;
}): string {
  if (item.kind === "report") return `/dashboard/reports/${item.id}`;
  return `/dashboard/projects/${item.project_id ?? ""}?tab=documents`;
}

export function approvalSelectionKey(item: { kind: ApprovalKind; id: string }): string {
  return `${item.kind}:${item.id}`;
}

export function parseApprovalSelection(
  raw: string | null | undefined,
): { kind: ApprovalKind; id: string } | null {
  if (!raw) return null;
  const match = raw.match(/^(report|document):(.+)$/);
  if (!match) return null;
  const kind = match[1] as ApprovalKind;
  const id = match[2]?.trim();
  if (!id) return null;
  return { kind, id };
}
