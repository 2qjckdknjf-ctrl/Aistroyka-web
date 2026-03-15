import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listByProject,
  getById,
  create,
  update,
} from "./document.repository";

function createSupabase(overrides: Partial<{
  from: ReturnType<SupabaseClient["from"]>;
}> = {}): SupabaseClient {
  const from = overrides.from ?? vi.fn();
  return {
    from: from as SupabaseClient["from"],
  } as unknown as SupabaseClient;
}

describe("document.repository", () => {
  describe("listByProject", () => {
    it("returns empty array when no documents", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await listByProject(supabase, "proj-1", "tenant-1");
      expect(result).toEqual([]);
    });

    it("returns documents when present", async () => {
      const docs = [
        {
          id: "doc-1",
          tenant_id: "tenant-1",
          project_id: "proj-1",
          type: "act",
          title: "Act 1",
          status: "uploaded",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: docs, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await listByProject(supabase, "proj-1", "tenant-1");
      expect(result).toEqual(docs);
    });
  });

  describe("getById", () => {
    it("returns null when not found", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await getById(supabase, "doc-1", "tenant-1");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates document with required fields", async () => {
      const created = {
        id: "doc-new",
        tenant_id: "tenant-1",
        project_id: "proj-1",
        type: "contract",
        title: "Contract A",
        status: "draft",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: created, error: null }),
            }),
          }),
        }),
      });
      const result = await create(supabase, "tenant-1", "user-1", {
        project_id: "proj-1",
        type: "contract",
        title: "Contract A",
      });
      expect(result).toEqual(created);
    });
  });

  describe("update", () => {
    it("updates status", async () => {
      const updated = {
        id: "doc-1",
        tenant_id: "tenant-1",
        project_id: "proj-1",
        type: "act",
        title: "Act 1",
        status: "approved",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      };
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updated, error: null }),
                }),
              }),
            }),
          }),
        }),
      });
      const result = await update(supabase, "doc-1", "tenant-1", {
        status: "approved",
      });
      expect(result?.status).toBe("approved");
    });
  });
});
