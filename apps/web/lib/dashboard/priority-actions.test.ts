import { describe, it, expect } from "vitest";
import { buildPriorityItems, hasOpsData } from "./priority-actions";

describe("buildPriorityItems", () => {
  it("returns empty when no queues have items", () => {
    const data = {
      kpis: { tasks_overdue: 0, stuckUploads: 0, failedJobs24h: 0 },
      queues: {
        tasksOverdue: [],
        tasksOpenToday: [],
        reportsPendingReview: [],
        workersOpenShiftNoReportToday: [],
        stuckUploads: [],
        aiFailed: [],
      },
    };
    expect(buildPriorityItems(data)).toEqual([]);
    expect(hasOpsData(data)).toBe(false);
  });

  it("adds overdue tasks with correct href", () => {
    const data = {
      kpis: { tasks_overdue: 1, stuckUploads: 0, failedJobs24h: 0 },
      queues: {
        tasksOverdue: [{ id: "task-1", title: "Install wiring", due_date: "2025-03-10" }],
        tasksOpenToday: [],
        reportsPendingReview: [],
        workersOpenShiftNoReportToday: [],
        stuckUploads: [],
        aiFailed: [],
      },
    };
    const items = buildPriorityItems(data);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Install wiring",
      reason: "Task past due date",
      href: "/dashboard/tasks/task-1",
      priority: "high",
    });
    expect(items[0]).not.toHaveProperty("sortKey");
  });

  it("adds stuck uploads when kpis.stuckUploads > 0", () => {
    const data = {
      kpis: { tasks_overdue: 0, stuckUploads: 3, failedJobs24h: 0 },
      queues: {
        tasksOverdue: [],
        tasksOpenToday: [],
        reportsPendingReview: [],
        workersOpenShiftNoReportToday: [],
        stuckUploads: [],
        aiFailed: [],
      },
    };
    const items = buildPriorityItems(data);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "3 upload(s) stuck >4h",
      href: "/dashboard/uploads?stuck=1",
      priority: "medium",
    });
  });

  it("orders overdue before AI failed (both high)", () => {
    const data = {
      kpis: { tasks_overdue: 1, stuckUploads: 0, failedJobs24h: 2 },
      queues: {
        tasksOverdue: [{ id: "t1", title: "Overdue task", due_date: "2025-01-01" }],
        tasksOpenToday: [],
        reportsPendingReview: [],
        workersOpenShiftNoReportToday: [],
        stuckUploads: [],
        aiFailed: [],
      },
    };
    const items = buildPriorityItems(data);
    expect(items[0].id).toBe("overdue-t1");
    expect(items[1].id).toBe("ai-failed");
    expect(items[1].priority).toBe("high");
  });

  it("limits to 7 items", () => {
    const data = {
      kpis: { tasks_overdue: 0, stuckUploads: 0, failedJobs24h: 0 },
      queues: {
        tasksOverdue: Array.from({ length: 10 }, (_, i) => ({
          id: `t-${i}`,
          title: `Task ${i}`,
          due_date: "2025-03-01",
        })),
        tasksOpenToday: [],
        reportsPendingReview: [],
        workersOpenShiftNoReportToday: [],
        stuckUploads: [],
        aiFailed: [],
      },
    };
    const items = buildPriorityItems(data);
    expect(items).toHaveLength(7);
  });
});
