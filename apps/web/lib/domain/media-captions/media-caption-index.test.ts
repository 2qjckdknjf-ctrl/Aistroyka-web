import { describe, expect, it, vi } from "vitest";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  replaceMediaCaptionSegments,
  searchMediaCaptionSegments,
} from "./media-caption-index.service";

describe("AIS-MEM-016 media caption index", () => {
  it("blocks lite clients from caption index/search", () => {
    expect(
      checkLiteAllowList("/api/v1/projects/p1/media-captions/index", "POST", "ios_worker")
    ).not.toBeNull();
    expect(
      checkLiteAllowList("/api/v1/projects/p1/media-captions/search", "GET", "android_lite")
    ).not.toBeNull();
  });

  it("migration is internal RLS and cascade-safe", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261028220000_ais_mem_016_media_caption_segments.sql"),
      "utf8"
    );
    expect(sql).toContain("media_caption_segments");
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toContain("on delete cascade");
    expect(sql).toContain("clock_uncertainty");
  });

  it("replaceMediaCaptionSegments fails closed without text", async () => {
    const result = await replaceMediaCaptionSegments(
      { from: vi.fn() } as never,
      {
        tenantId: "t1",
        projectId: "p1",
        mediaId: "m1",
        actorUserId: "u1",
        segments: [],
      }
    );
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });

  it("replaceMediaCaptionSegments deletes then inserts segments", async () => {
    const delEq3 = vi.fn().mockResolvedValue({ error: null });
    const delEq2 = vi.fn().mockReturnValue({ eq: delEq3 });
    const delEq1 = vi.fn().mockReturnValue({ eq: delEq2 });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({ eq: delEq1 })),
        insert,
      })),
    };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m1",
      actorUserId: "u1",
      segments: [{ startSeconds: 0, endSeconds: 1.5, text: "tile floor" }],
    });
    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(insert).toHaveBeenCalled();
  });

  it("searchMediaCaptionSegments returns lexical hits", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "s1",
          media_id: "m1",
          start_ms: 0,
          end_ms: 1500,
          text: "tile floor",
          clock_uncertainty: "exact",
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const ilike = vi.fn().mockReturnValue({ order });
    const eq2 = vi.fn().mockReturnValue({ ilike });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: eq1 })),
      })),
    };
    const result = await searchMediaCaptionSegments(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      query: "tile",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.hits[0]?.text).toBe("tile floor");
  });
});
