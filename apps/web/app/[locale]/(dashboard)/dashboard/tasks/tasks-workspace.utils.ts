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
