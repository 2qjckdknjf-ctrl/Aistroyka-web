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
    const replaceSql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261028221000_ais_mem_016_replace_media_caption_segments.sql"
      ),
      "utf8"
    );
    expect(replaceSql).toContain("replace_media_caption_segments");
    expect(replaceSql).toContain("media not found");
  });

  it("replaceMediaCaptionSegments fails closed without text", async () => {
    const result = await replaceMediaCaptionSegments(
      { from: vi.fn(), rpc: vi.fn() } as never,
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

  it("replaceMediaCaptionSegments rejects a one-character language before write", async () => {
    const rpc = vi.fn();
    const result = await replaceMediaCaptionSegments(
      { from: vi.fn(), rpc } as never,
      {
        tenantId: "t1",
        projectId: "p1",
        mediaId: "m1",
        actorUserId: "u1",
        language: "e",
        segments: [{ startSeconds: 0, endSeconds: 1.5, text: "tile floor" }],
      }
    );
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("replaceMediaCaptionSegments rejects media that belongs to another project", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "m1", project_id: "other", tenant_id: "t1", type: "video", file_url: "x" },
      error: null,
    });
    const eq2 = vi.fn().mockReturnValue({ maybeSingle });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const rpc = vi.fn();
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: eq1 })),
      })),
      rpc,
    };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m1",
      actorUserId: "u1",
      segments: [{ startSeconds: 0, endSeconds: 1.5, text: "tile floor" }],
    });
    expect(result).toMatchObject({ ok: false, code: "MEDIA_NOT_FOUND" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("replaceMediaCaptionSegments replaces via a single RPC after binding media", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "m1", project_id: "p1", tenant_id: "t1", type: "video", file_url: "x" },
      error: null,
    });
    const eq2 = vi.fn().mockReturnValue({ maybeSingle });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: eq1 })),
        delete: vi.fn(() => {
          throw new Error("delete must not run outside the replace RPC");
        }),
        insert: vi.fn(() => {
          throw new Error("insert must not run outside the replace RPC");
        }),
      })),
      rpc,
    };
    const result = await replaceMediaCaptionSegments(supabase as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m1",
      actorUserId: "u1",
      segments: [{ startSeconds: 0, endSeconds: 1.5, text: "tile floor" }],
    });
    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(rpc).toHaveBeenCalledWith(
      "replace_media_caption_segments",
      expect.objectContaining({
        p_tenant_id: "t1",
        p_project_id: "p1",
        p_media_id: "m1",
      })
    );
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
