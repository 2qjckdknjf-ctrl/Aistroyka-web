import { describe, expect, it, vi } from "vitest";
import { getChanges, getChangesAfter, getMinCursor } from "./change-log.repository";

const mockRows = (ids: number[]) =>
  ids.map((id) => ({
    id,
    tenant_id: "t1",
    resource_type: "report",
    resource_id: `r-${id}`,
    change_type: "created",
    changed_by: null,
    ts: new Date().toISOString(),
    payload: {},
  }));

vi.mock("@supabase/supabase-js", () => ({}));

describe("change-log.repository", () => {
  describe("getChanges", () => {
    it("returns nextCursor as last row id when rows exist", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    then: (fn: (r: { data: unknown }) => void) =>
                      fn({ data: mockRows([101, 102, 103]) }),
                  })),
                })),
              })),
            })),
          })),
        })),
      } as any;
      const result = await getChanges(supabase, "t1", 100, 10);
      expect(result.rows).toHaveLength(3);
      expect(result.nextCursor).toBe(103);
    });

    it("returns nextCursor as afterCursor when no rows", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({ then: (fn: (r: { data: unknown }) => void) => fn({ data: [] }) })),
                })),
              })),
            })),
          })),
        })),
      } as any;
      const result = await getChanges(supabase, "t1", 50, 10);
      expect(result.rows).toHaveLength(0);
      expect(result.nextCursor).toBe(50);
    });
  });

  describe("getChangesAfter", () => {
    it("returns empty array on error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({ then: (fn: (r: { error: unknown }) => void) => fn({ error: new Error("db") }) })),
                })),
              })),
            })),
          })),
        })),
      } as any;
      const result = await getChangesAfter(supabase, "t1", 0, 10);
      expect(result).toEqual([]);
    });
  });

  describe("getMinCursor", () => {
    it("returns min id for tenant", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 5 }, error: null })),
                })),
              })),
            })),
          })),
        })),
      } as any;
      const result = await getMinCursor(supabase, "t1");
      expect(result).toBe(5);
    });

    it("returns 0 when no rows or error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
              })),
            })),
          })),
        })),
      } as any;
      const result = await getMinCursor(supabase, "t1");
      expect(result).toBe(0);
    });
  });
});
