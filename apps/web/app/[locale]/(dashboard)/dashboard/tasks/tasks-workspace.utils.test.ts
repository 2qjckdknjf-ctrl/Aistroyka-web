import { describe, expect, it } from "vitest";
import {
  groupTasksByBoardColumn,
  isTaskOverdue,
  parseTasksWorkspaceView,
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
});
