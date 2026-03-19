import { describe, expect, it, vi } from "vitest";
import { getAssignedTaskIds } from "@/lib/domain/task-assignments";
import * as repo from "./task.repository";

vi.mock("@/lib/domain/task-assignments", () => ({
  getAssignedTaskIds: vi.fn().mockResolvedValue([]),
}));

const result = Promise.resolve({ data: [], error: null, count: 0 });
const chain = {
  then: (resolve: (v: { data: unknown[]; error: null; count: number }) => void) => result.then(resolve),
  eq: () => chain,
  or: () => chain,
  gte: () => chain,
  lte: () => chain,
  order: () => chain,
  range: () => chain,
  select: () => chain,
  ilike: () => chain,
};

describe("task.repository list", () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              range: () => chain,
              eq: () => chain,
              or: () => chain,
              gte: () => chain,
              lte: () => chain,
              ilike: () => chain,
            }),
          }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof repo.list>[0];

  it("calls getAssignedTaskIds when assigned_to filter is set", async () => {
    vi.mocked(getAssignedTaskIds).mockResolvedValue([]);
    const out = await repo.list(supabase, "tenant-1", { assigned_to: "user-contractor" });
    expect(getAssignedTaskIds).toHaveBeenCalledWith(supabase, "tenant-1", "user-contractor");
    expect(out.data).toEqual([]);
    expect(out.total).toBe(0);
  });

  it("does not call getAssignedTaskIds when assigned_to is not set", async () => {
    vi.mocked(getAssignedTaskIds).mockClear();
    await repo.list(supabase, "tenant-1", { project_id: "proj-1" });
    expect(getAssignedTaskIds).not.toHaveBeenCalled();
  });
});
