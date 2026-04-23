import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertDocumentEvent, listDocumentEvents } from "./document-event.repository";

function createSupabase(overrides: Partial<{
  from: ReturnType<SupabaseClient["from"]>;
}> = {}): SupabaseClient {
  const from = overrides.from ?? vi.fn();
  return {
    from: from as SupabaseClient["from"],
  } as unknown as SupabaseClient;
}

describe("document-event.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insertDocumentEvent", () => {
    it("returns true on success", async () => {
      const insert = vi.fn().mockResolvedValue({ error: null });
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({ insert }),
      });
      const ok = await insertDocumentEvent(
        supabase,
        "tenant-1",
        "doc-1",
        "created",
        "user-1",
        null
      );
      expect(ok).toBe(true);
      expect(insert).toHaveBeenCalledWith({
        tenant_id: "tenant-1",
        document_id: "doc-1",
        event_type: "created",
        actor_user_id: "user-1",
        note: null,
      });
    });

    it("returns false when insert fails", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: { message: "rls" } }),
        }),
      });
      const ok = await insertDocumentEvent(
        supabase,
        "tenant-1",
        "doc-1",
        "approved",
        "user-1",
        "note"
      );
      expect(ok).toBe(false);
    });
  });

  describe("listDocumentEvents", () => {
    it("returns empty array on error", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: null, error: { message: "x" } }),
                }),
              }),
            }),
          }),
        }),
      });
      const rows = await listDocumentEvents(supabase, "tenant-1", "doc-1");
      expect(rows).toEqual([]);
    });

    it("returns ordered rows for tenant and document", async () => {
      const rows = [
        {
          id: "e1",
          tenant_id: "tenant-1",
          document_id: "doc-1",
          event_type: "created" as const,
          actor_user_id: "u1",
          note: null,
          created_at: "2026-01-01T00:00:00Z",
        },
      ];
      const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
      const order = vi.fn().mockReturnValue({ limit });
      const eqDoc = vi.fn().mockReturnValue({ order });
      const eqTenant = vi.fn().mockReturnValue({ eq: eqDoc });
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: eqTenant,
          }),
        }),
      });
      const result = await listDocumentEvents(supabase, "tenant-1", "doc-1", 50);
      expect(result).toEqual(rows);
      expect(eqTenant).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(eqDoc).toHaveBeenCalledWith("document_id", "doc-1");
      expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
      expect(limit).toHaveBeenCalledWith(50);
    });
  });
});
