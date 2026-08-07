import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveImageUrl } from "./resolve-image-url";

vi.mock("@/lib/config", () => ({
  getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }),
}));

describe("resolveImageUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strips media/ prefix when building public URL from upload session", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { object_path: "media/tenant-1/session-1/photo.jpg" },
      error: null,
    });
    const eqStatus = vi.fn(() => ({ maybeSingle }));
    const eqId = vi.fn(() => ({ eq: eqStatus }));
    const select = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    const url = await resolveImageUrl(supabase, {
      report_id: "rpt-1",
      upload_session_id: "session-1",
    });

    expect(url).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/tenant-1/session-1/photo.jpg"
    );
    expect(url).not.toContain("/media/media/");
  });

  it("returns media.file_url when media_id is provided", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { file_url: "https://cdn.example/photo.jpg" },
      error: null,
    });
    const eqId = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq: eqId }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    const url = await resolveImageUrl(supabase, {
      report_id: "rpt-1",
      media_id: "m1",
    });

    expect(url).toBe("https://cdn.example/photo.jpg");
  });
});
