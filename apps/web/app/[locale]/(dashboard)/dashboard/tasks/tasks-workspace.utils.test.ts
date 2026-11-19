import { describe, expect, it } from "vitest";
import {
  buildTaskDetailHref,
  buildTasksWorkspaceHref,
  groupTasksByBoardColumn,
  isTaskOverdue,
  parseSelectedTaskId,
  parseTasksWorkspaceView,
  resolveTasksReturnHref,
  sortTasksForPhonePriority,
  taskStatusBadgeVariant,
} from "./tasks-workspace.utils";

describe("tasks workspace utils", () => {
  it("defaults unknown view to list", () => {
    expect(parseTasksWorkspaceView(null)).toBe("list");
    expect(parseTasksWorkspaceView("board")).toBe("board");
    expect(parseTasksWorkspaceView("kanban")).toBe("list");
  });

  it("groups tasks into board columns", () => {
    const groups = groupTasksByBoardColumn([
      { id: "1", status: "pending" },
      { id: "2", status: "in_progress" },
      { id: "3", status: "done" },
      { id: "4", status: "weird" },
    ]);
    expect(groups.pending.map((t) => t.id)).toEqual(["1", "4"]);
    expect(groups.in_progress.map((t) => t.id)).toEqual(["2"]);
    expect(groups.done.map((t) => t.id)).toEqual(["3"]);
    expect(groups.cancelled).toEqual([]);
  });

  it("prioritizes overdue and due-today on phone", () => {
    const sorted = sortTasksForPhonePriority(
      [
        { id: "later", status: "pending", due_date: "2026-09-01", title: "Later" },
        { id: "overdue", status: "pending", due_date: "2026-08-01", title: "Overdue" },
        { id: "today", status: "in_progress", due_date: "2026-08-20", title: "Today" },
        { id: "done", status: "done", due_date: "2026-07-01", title: "Done" },
      ],
      "2026-08-20",
    );
    expect(sorted.map((t) => t.id)).toEqual(["overdue", "today", "later", "done"]);
  });

  it("marks overdue only for open tasks with past due dates", () => {
    expect(isTaskOverdue("pending", "2026-08-01", "2026-08-20")).toBe(true);
    expect(isTaskOverdue("done", "2026-08-01", "2026-08-20")).toBe(false);
    expect(isTaskOverdue("pending", null, "2026-08-20")).toBe(false);
  });

  it("maps status badge variants", () => {
    expect(taskStatusBadgeVariant("done")).toBe("success");
    expect(taskStatusBadgeVariant("cancelled")).toBe("danger");
    expect(taskStatusBadgeVariant("in_progress")).toBe("warning");
    expect(taskStatusBadgeVariant("pending")).toBe("neutral");
  });

  it("parses selected task ids from query values", () => {
    expect(parseSelectedTaskId(null)).toBeNull();
    expect(parseSelectedTaskId("  ")).toBeNull();
    expect(parseSelectedTaskId(" task-1 ")).toBe("task-1");
  });

  it("builds workspace and detail hrefs with filter/task context", () => {
    expect(buildTasksWorkspaceHref({})).toBe("/dashboard/tasks");
    expect(
      buildTasksWorkspaceHref({
        view: "board",
        taskId: "t1",
        filters: { project_id: "p1", scope: "mine", empty: "" },
      }),
    ).toBe("/dashboard/tasks?view=board&task=t1&project_id=p1&scope=mine");
    expect(buildTaskDetailHref("t1")).toBe("/dashboard/tasks/t1");
    expect(buildTaskDetailHref("t1", "/dashboard/tasks?view=board")).toBe(
      `/dashboard/tasks/t1?returnTo=${encodeURIComponent("/dashboard/tasks?view=board")}`,
    );
  });

  it("resolves returnTo only for dashboard tasks paths without re-decoding", () => {
    expect(resolveTasksReturnHref(null)).toBe("/dashboard/tasks");
    expect(resolveTasksReturnHref("/dashboard/tasks?view=board&task=t1")).toBe(
      "/dashboard/tasks?view=board&task=t1",
    );
    // Already-decoded useSearchParams value must keep filter encodings intact.
    expect(resolveTasksReturnHref("/dashboard/tasks?q=A%26B&view=board")).toBe(
      "/dashboard/tasks?q=A%26B&view=board",
    );
    // Still-encoded outer values fail closed (do not double-decode).
    expect(resolveTasksReturnHref(encodeURIComponent("/dashboard/tasks?view=board"))).toBe(
      "/dashboard/tasks",
    );
    expect(resolveTasksReturnHref("https://evil.example/dashboard/tasks")).toBe("/dashboard/tasks");
    expect(resolveTasksReturnHref("//evil.example")).toBe("/dashboard/tasks");
    expect(resolveTasksReturnHref("/owner")).toBe("/dashboard/tasks");
  });
});
