import { describe, expect, it, vi } from "vitest";
import { assign } from "./task-assignments.repository";

describe("task-assignments.repository assign", () => {
  it("returns false when worker_tasks update matches no row", async () => {
    const supabase = {
      from(table: string) {
        if (table === "task_assignments") {
          return {
            delete: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      },
    };
    expect(await assign(supabase as never, "tenant-1", "task-1", "worker-1", "manager-1")).toBe(false);
  });

  it("returns true only when the worker_tasks row is updated", async () => {
    const supabase = {
      from(table: string) {
        if (table === "task_assignments") {
          return {
            delete: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: { id: "task-1" }, error: null }),
                }),
              }),
            }),
          }),
        };
      },
    };
    expect(await assign(supabase as never, "tenant-1", "task-1", "worker-1", "manager-1")).toBe(true);
  });

  it("returns false when assignment insert fails", async () => {
    const update = vi.fn();
    const supabase = {
      from(table: string) {
        if (table === "task_assignments") {
          return {
            delete: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
            insert: async () => ({ error: { message: "fail" } }),
          };
        }
        return { update };
      },
    };
    expect(await assign(supabase as never, "tenant-1", "task-1", "worker-1", "manager-1")).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
