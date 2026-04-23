/**
 * AI Brain Phase C — Memory repository tests (mocked Supabase).
 */

import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createMemoryRecord,
  getRelevantMemory,
  markMemorySuperseded,
} from "./memory.repository";

function createMockSupabase(overrides: Partial<{ from: ReturnType<SupabaseClient["from"]> }> = {}) {
  const from = overrides.from ?? vi.fn();
  return { from: from as SupabaseClient["from"] } as unknown as SupabaseClient;
}

describe("memory.repository", () => {
  describe("createMemoryRecord", () => {
    it("returns null on insert error", async () => {
      const supabase = createMockSupabase({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error("db error") }),
            }),
          }),
        }),
      });
      const result = await createMemoryRecord(supabase, {
        tenantId: "t1",
        memoryType: "project_working",
        scope: "project",
        sourceKind: "human_confirmed",
        title: "Test",
        body: {},
      });
      expect(result).toBeNull();
    });

    it("returns record on success", async () => {
      const row = {
        id: "mem-1",
        tenant_id: "t1",
        project_id: "p1",
        user_id: null,
        memory_type: "project_working",
        scope: "project",
        source_kind: "human_confirmed",
        source_ref: null,
        title: "Test",
        body: {},
        facts_used: [],
        grounding_refs: [],
        confidence: "high",
        expires_at: "2026-03-30T00:00:00Z",
        status: "active",
        superseded_by: null,
        created_at: "2026-03-23T12:00:00Z",
        updated_at: "2026-03-23T12:00:00Z",
      };
      const supabase = createMockSupabase({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: row, error: null }),
            }),
          }),
        }),
      });
      const result = await createMemoryRecord(supabase, {
        tenantId: "t1",
        projectId: "p1",
        memoryType: "project_working",
        scope: "project",
        sourceKind: "human_confirmed",
        title: "Test",
        body: {},
      });
      expect(result).not.toBeNull();
      expect(result!.memoryId).toBe("mem-1");
      expect(result!.title).toBe("Test");
    });
  });

  describe("getRelevantMemory", () => {
    it("returns empty array when no projectId and no userId filter", async () => {
      const chain = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const supabase = createMockSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(chain),
        }),
      });
      const result = await getRelevantMemory(supabase, "t1", { limit: 5 });
      expect(result).toEqual([]);
    });
  });
});
