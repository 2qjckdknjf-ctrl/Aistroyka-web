import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
  notifyTenantManagers,
  notifyOwnerSide,
  notifyProjectOwners,
  notifyProjectManagers,
} from "./manager-notifications.repository";

/**
 * Build a chain that returns a promise. Each method returns the chain; the chain is thenable.
 */
function chain<T>(resolveValue: T) {
  const c = {
    eq: () => c,
    is: () => c,
    order: () => c,
    range: () => c,
    select: () => c,
    update: () => c,
    in: () => c,
    then: (fn: (v: T) => unknown) => Promise.resolve(resolveValue).then(fn),
    catch: () => c,
  };
  return c as unknown as Promise<T> & Record<string, () => typeof c>;
}

describe("manager-notifications.repository", () => {
  describe("unreadCount", () => {
    it("returns count of unread notifications", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => chain({ count: 5 })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const count = await unreadCount(supabase, "t1", "u1");
      expect(count).toBe(5);
    });

    it("returns 0 when count is null or no unread", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => chain({ count: null })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const count = await unreadCount(supabase, "t1", "u1");
      expect(count).toBe(0);
    });
  });

  describe("markRead", () => {
    it("returns true when update succeeds (no error)", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => chain({ error: null })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const ok = await markRead(supabase, "n1", "t1", "u1");
      expect(ok).toBe(true);
    });

    it("returns false when update fails", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => chain({ error: new Error("db error") })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const ok = await markRead(supabase, "n1", "t1", "u1");
      expect(ok).toBe(false);
    });
  });

  describe("markAllRead", () => {
    it("returns number of updated rows", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  select: vi.fn(() => chain({ data: [{ id: "n1" }, { id: "n2" }], error: null })),
                })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const count = await markAllRead(supabase, "t1", "u1");
      expect(count).toBe(2);
    });

    it("returns 0 when error", async () => {
      const supabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  select: vi.fn(() => chain({ data: [], error: new Error("db error") })),
                })),
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient;
      const count = await markAllRead(supabase, "t1", "u1");
      expect(count).toBe(0);
    });
  });

  describe("listForUser", () => {
    it("returns data and total", async () => {
      const rows = [
        {
          id: "n1",
          tenant_id: "t1",
          user_id: "u1",
          type: "issue_created",
          title: "New issue",
          body: null,
          read_at: null,
          target_type: "issue",
          target_id: "i1",
          project_id: "p1",
          created_at: "2025-01-01T00:00:00Z",
        },
      ];
      const countChain = chain({ count: 1 });
      const dataChain = chain({ data: rows });
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
            const isHead = opts?.head === true;
            if (isHead) {
              return { eq: vi.fn(() => ({ eq: vi.fn(() => countChain) })) };
            }
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({ range: vi.fn(() => dataChain) })),
                })),
              })),
            };
          }),
        })),
      } as unknown as SupabaseClient;
      const { data, total } = await listForUser(supabase, "t1", "u1");
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("New issue");
      expect(data[0].project_id).toBe("p1");
      expect(total).toBe(1);
    });
  });

  describe("notifyTenantManagers", () => {
    it("creates notifications for tenant managers", async () => {
      const insertSpy = vi.fn(() => chain({ error: null }));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "tenant_members") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => chain({ data: [{ user_id: "u1" }, { user_id: "u2" }] })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyTenantManagers(supabase, "t1", {
        type: "issue_created",
        title: "New issue",
        body: "Bug found",
        target_type: "issue",
        target_id: "i1",
        project_id: "p1",
      });
      expect(insertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenant_id: "t1",
            type: "issue_created",
            title: "New issue",
            target_type: "issue",
            target_id: "i1",
            project_id: "p1",
          }),
        ])
      );
    });

    it("does not insert when no members", async () => {
      const insertSpy = vi.fn();
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "tenant_members") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => chain({ data: [] })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyTenantManagers(supabase, "t1", { type: "x", title: "Y" });
      expect(insertSpy).not.toHaveBeenCalled();
    });
  });

  describe("notifyOwnerSide", () => {
    it("notifies tenant owner and owner-role members", async () => {
      const insertSpy = vi.fn(() => chain({ error: null }));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "tenants") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => chain({ data: { user_id: "u-owner" } })),
                })),
              })),
            };
          }
          if (table === "tenant_members") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => chain({ data: [{ user_id: "u-owner" }, { user_id: "u-owner2" }] })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyOwnerSide(supabase, "t1", {
        type: "document_under_review",
        title: "Document submitted for review",
        target_type: "document",
        target_id: "d1",
        project_id: "p1",
      });
      expect(insertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenant_id: "t1",
            type: "document_under_review",
            title: "Document submitted for review",
            target_type: "document",
            target_id: "d1",
            project_id: "p1",
          }),
        ])
      );
      const inserted = insertSpy.mock.calls[0][0] as Array<{ user_id: string }>;
      const userIds = inserted.map((r) => r.user_id);
      expect(userIds).toContain("u-owner");
      expect(userIds).toContain("u-owner2");
    });

    it("falls back to tenant managers when no owner-side users", async () => {
      const insertSpy = vi.fn(() => chain({ error: null }));
      let tmCallCount = 0;
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "tenants") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => chain({ data: null })),
                })),
              })),
            };
          }
          if (table === "tenant_members") {
            tmCallCount++;
            const isOwnerQuery = tmCallCount === 1;
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => chain({ data: [] })),
                  in: vi.fn(() => chain({ data: isOwnerQuery ? [] : [{ user_id: "u-mgr" }] })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyOwnerSide(supabase, "t1", { type: "document_under_review", title: "Doc" });
      expect(insertSpy).toHaveBeenCalled();
      const inserted = insertSpy.mock.calls[0][0] as Array<{ user_id: string }>;
      expect(inserted.map((r) => r.user_id)).toContain("u-mgr");
    });
  });

  describe("notifyProjectManagers", () => {
    it("notifies project managers and owners from project_members", async () => {
      const insertSpy = vi.fn(() => chain({ error: null }));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "project_members") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => ({
                      eq: vi.fn(() =>
                        chain({ data: [{ user_id: "u-mgr1" }, { user_id: "u-owner1" }] })
                      ),
                    })),
                  })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyProjectManagers(supabase, "t1", "p1", {
        type: "issue_created",
        title: "New issue created",
        target_type: "issue",
        target_id: "i1",
        project_id: "p1",
      });
      expect(insertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenant_id: "t1",
            user_id: "u-mgr1",
            type: "issue_created",
            project_id: "p1",
          }),
          expect.objectContaining({
            tenant_id: "t1",
            user_id: "u-owner1",
            type: "issue_created",
            project_id: "p1",
          }),
        ])
      );
    });
  });

  describe("notifyProjectOwners", () => {
    it("notifies project owners from project_members", async () => {
      const insertSpy = vi.fn(() => chain({ error: null }));
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "project_members") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      eq: vi.fn(() =>
                        chain({ data: [{ user_id: "u-powner1" }, { user_id: "u-powner2" }] })
                      ),
                    })),
                  })),
                })),
              })),
            };
          }
          if (table === "manager_notifications") {
            return { insert: insertSpy };
          }
          return {};
        }),
      } as unknown as SupabaseClient;
      await notifyProjectOwners(supabase, "t1", "p1", {
        type: "document_under_review",
        title: "Document submitted",
        target_type: "document",
        target_id: "d1",
        project_id: "p1",
      });
      expect(insertSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenant_id: "t1",
            user_id: "u-powner1",
            type: "document_under_review",
            project_id: "p1",
          }),
          expect.objectContaining({
            tenant_id: "t1",
            user_id: "u-powner2",
            type: "document_under_review",
            project_id: "p1",
          }),
        ])
      );
    });
  });
});
