/** Tasks workspace helpers — board/list IA (canonical redesign Surface D). */

export type TasksWorkspaceView = "list" | "board";

export const TASK_BOARD_COLUMNS = ["pending", "in_progress", "done", "cancelled"] as const;

export type TaskBoardColumnId = (typeof TASK_BOARD_COLUMNS)[number];

export type TaskBoardItem = {
  id: string;
  status: string;
  due_date: string | null;
  title: string;
};

export function parseTasksWorkspaceView(raw: string | null | undefined): TasksWorkspaceView {
  return raw === "board" ? "board" : "list";
}

export function taskStatusBadgeVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "done":
      return "success";
    case "cancelled":
      return "danger";
    case "in_progress":
      return "warning";
    default:
      return "neutral";
  }
}

export function groupTasksByBoardColumn<T extends { status: string }>(
  tasks: readonly T[],
): Record<TaskBoardColumnId, T[]> {
  const groups: Record<TaskBoardColumnId, T[]> = {
    pending: [],
    in_progress: [],
    done: [],
    cancelled: [],
  };
  for (const task of tasks) {
    switch (task.status) {
      case "pending":
        groups.pending.push(task);
        break;
      case "in_progress":
        groups.in_progress.push(task);
        break;
      case "done":
        groups.done.push(task);
        break;
      case "cancelled":
        groups.cancelled.push(task);
        break;
      default:
        groups.pending.push(task);
        break;
    }
  }
  return groups;
}

/** Phone-first priority: overdue → due soon → active → rest. */
export function sortTasksForPhonePriority<T extends TaskBoardItem>(
  tasks: readonly T[],
  todayIso: string,
): T[] {
  const score = (task: TaskBoardItem): number => {
    if (task.status === "done" || task.status === "cancelled") return 400;
    if (task.due_date && task.due_date < todayIso) return 0;
    if (task.due_date && task.due_date === todayIso) return 50;
    if (task.status === "in_progress") return 100;
    if (task.status === "pending") return 200;
    return 300;
  };
  return [...tasks].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    const dueA = a.due_date ?? "9999-12-31";
    const dueB = b.due_date ?? "9999-12-31";
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export function isTaskOverdue(status: string, dueDate: string | null, todayIso: string): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "cancelled") return false;
  return dueDate < todayIso;
}

/** V2-WEB-02: selected task from `?task=` — empty/whitespace → null. */
export function parseSelectedTaskId(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  return id.length > 0 ? id : null;
}

/**
 * V2-WEB-02: build the tasks workspace href while preserving filters/view/task.
 * Absolute dashboard path (locale prefix handled by next-intl Link).
 */
export function buildTasksWorkspaceHref(input: {
  view?: TasksWorkspaceView | null;
  taskId?: string | null;
  filters?: Record<string, string | null | undefined>;
}): string {
  const qs = new URLSearchParams();
  if (input.view === "board") qs.set("view", "board");
  const taskId = parseSelectedTaskId(input.taskId ?? null);
  if (taskId) qs.set("task", taskId);
  for (const [key, value] of Object.entries(input.filters ?? {})) {
    if (typeof value === "string" && value.trim()) qs.set(key, value.trim());
  }
  const out = qs.toString();
  return out ? `/dashboard/tasks?${out}` : "/dashboard/tasks";
}

/** Full task detail href with optional returnTo for Back restoration. */
export function buildTaskDetailHref(taskId: string, returnTo?: string | null): string {
  const id = parseSelectedTaskId(taskId);
  if (!id) return "/dashboard/tasks";
  const base = `/dashboard/tasks/${id}`;
  const ret = typeof returnTo === "string" ? returnTo.trim() : "";
  if (!ret) return base;
  return `${base}?returnTo=${encodeURIComponent(ret)}`;
}

/** Safe Back target from returnTo — only allow same-origin dashboard tasks paths. */
export function resolveTasksReturnHref(returnTo: string | null | undefined): string {
  if (typeof returnTo !== "string" || !returnTo.trim()) return "/dashboard/tasks";
  let decoded = returnTo.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return "/dashboard/tasks";
  }
  if (!decoded.startsWith("/dashboard/tasks")) return "/dashboard/tasks";
  if (decoded.startsWith("//") || decoded.includes("://")) return "/dashboard/tasks";
  return decoded;
}
