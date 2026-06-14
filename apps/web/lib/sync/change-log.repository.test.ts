import { describe, expect, it, vi } from "vitest";
import { getChanges, getChangesAfter, getMaxCursor, getMinRetainedCursor } from "./change-log.repository";

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
    it("throws on query error instead of returning an empty delta", async () => {
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
      await expect(getChangesAfter(supabase, "t1", 0, 10)).rejects.toThrow("db");
    });
  });

  describe("getMaxCursor", () => {
    const build = (result: { data?: unknown; error?: unknown }) =>
      ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: () => Promise.resolve(result),
                })),
              })),
            })),
          })),
        })),
      }) as any;

    it("throws on query error instead of reading it as cursor 0", async () => {
      await expect(getMaxCursor(build({ error: new Error("db") }), "t1")).rejects.toThrow("db");
    });

    it("returns 0 when there are no rows (no error)", async () => {
      await expect(getMaxCursor(build({ data: null, error: null }), "t1")).resolves.toBe(0);
    });
  });

  describe("getMinRetainedCursor", () => {
    it("returns 0 when env unset", () => {
      vi.stubEnv("SYNC_MIN_RETAINED_CURSOR", "");
      expect(getMinRetainedCursor()).toBe(0);
    });
    it("returns parsed number when env set", () => {
      vi.stubEnv("SYNC_MIN_RETAINED_CURSOR", "50");
      expect(getMinRetainedCursor()).toBe(50);
    });
    it("returns 0 for invalid or negative", () => {
      vi.stubEnv("SYNC_MIN_RETAINED_CURSOR", "abc");
      expect(getMinRetainedCursor()).toBe(0);
      vi.stubEnv("SYNC_MIN_RETAINED_CURSOR", "-1");
      expect(getMinRetainedCursor()).toBe(0);
    });
  });
});
