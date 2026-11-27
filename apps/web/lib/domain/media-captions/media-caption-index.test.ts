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

  it("replaces normalized timecoded text through the atomic database boundary", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
      from: vi.fn(),
    };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "T1",
      projectId: "P1",
      mediaId: "M1",
      actorUserId: "U1",
      segments: [{ startSeconds: 0, endSeconds: 1.5, text: "tile floor" }],
    });
    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith("replace_media_caption_segments", {
      p_tenant_id: "t1", p_project_id: "p1", p_media_id: "m1", p_actor_user_id: "u1",
      p_source_kind: "transcription",
      p_segments: [{ start_ms: 0, end_ms: 1500, text: "tile floor", language: null, clock_uncertainty: "exact" }],
    });
  });

  it.each(["e", "x".repeat(17)])("rejects invalid language before any index mutation: %s", async (language) => {
    const supabase = { rpc: vi.fn(), from: vi.fn() };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1", projectId: "p1", mediaId: "m1", actorUserId: "u1", language,
      segments: [], fullText: "Previously paid transcript",
    });
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it.each([
    ["P0002", "MEDIA_SCOPE_MISMATCH"], ["42501", "INSUFFICIENT_RIGHTS"],
    ["23514", "INVALID_INPUT"], ["PGRST202", "REPLACE_FAILED"],
  ])("returns a safe code for database rejection %s", async (databaseCode, code) => {
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: databaseCode, message: "private diagnostic" } }), from: vi.fn() };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1", projectId: "p1", mediaId: "m1", actorUserId: "u1",
      segments: [], fullText: "Previously paid transcript",
    });
    expect(result).toMatchObject({ ok: false, code });
    expect(JSON.stringify(result)).not.toContain("private diagnostic");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns a safe failure when the database connection throws", async () => {
    const supabase = { rpc: vi.fn().mockRejectedValue(new Error("connection lost")), from: vi.fn() };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1", projectId: "p1", mediaId: "m1", actorUserId: "u1",
      segments: [], fullText: "Previously paid transcript",
    });
    expect(result).toMatchObject({ ok: false, code: "REPLACE_FAILED" });
    expect(supabase.from).not.toHaveBeenCalled();
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
