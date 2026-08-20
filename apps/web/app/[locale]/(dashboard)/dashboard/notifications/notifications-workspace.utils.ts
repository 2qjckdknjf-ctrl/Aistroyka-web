/** Notifications inbox helpers — unread-first density (canonical redesign). */

export type NotificationReadFilter = "all" | "unread" | "read";

export type NotificationWorkspaceItem = {
  id: string;
  created_at: string;
  read_at?: string | null;
  target_type?: string;
  target_id?: string;
  project_id?: string;
};

export function parseNotificationReadFilter(
  raw: string | null | undefined,
): NotificationReadFilter {
  if (raw === "unread" || raw === "read") return raw;
  return "all";
}

export function isNotificationUnread(item: { read_at?: string | null }): boolean {
  return item.read_at == null || item.read_at === "";
}

export function filterNotificationsByReadState<T extends { read_at?: string | null }>(
  items: readonly T[],
  filter: NotificationReadFilter,
): T[] {
  switch (filter) {
    case "all":
      return [...items];
    case "unread":
      return items.filter((item) => isNotificationUnread(item));
    case "read":
      return items.filter((item) => !isNotificationUnread(item));
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function countNotificationsByReadState(
  items: ReadonlyArray<{ read_at?: string | null }>,
): Record<NotificationReadFilter, number> {
  const counts: Record<NotificationReadFilter, number> = {
    all: items.length,
    unread: 0,
    read: 0,
  };
  for (const item of items) {
    if (isNotificationUnread(item)) counts.unread += 1;
    else counts.read += 1;
  }
  return counts;
}

/** Unread first, then newest. */
export function sortNotificationsByAttention<
  T extends { created_at: string; read_at?: string | null },
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const aUnread = isNotificationUnread(a) ? 0 : 1;
    const bUnread = isNotificationUnread(b) ? 0 : 1;
    if (aUnread !== bUnread) return aUnread - bUnread;
    if (a.created_at === b.created_at) return 0;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export function buildNotificationHref(n: {
  target_type?: string;
  target_id?: string;
  project_id?: string;
}): string {
  if (n.target_type === "project" && n.target_id) return `/dashboard/projects/${n.target_id}`;
  if (n.target_type === "issue" && n.project_id) return `/dashboard/projects/${n.project_id}?tab=issues`;
  if (n.target_type === "document" && n.project_id) {
    return `/dashboard/projects/${n.project_id}?tab=documents`;
  }
  if (n.target_type === "report" && n.target_id) return `/dashboard/daily-reports/${n.target_id}`;
  if (n.target_type === "task" && n.target_id) return `/dashboard/tasks/${n.target_id}`;
  if (n.project_id) return `/dashboard/projects/${n.project_id}`;
  return "/dashboard";
}
