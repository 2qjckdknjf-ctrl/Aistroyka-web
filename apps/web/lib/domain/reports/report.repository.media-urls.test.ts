import { beforeEach, describe, expect, it, vi } from "vitest";
import { listMediaByReportIdWithUrls } from "./report.repository";

vi.mock("@/lib/config", () => ({
  getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }),
}));

describe("listMediaByReportIdWithUrls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds public URL without doubling media/ for upload-session object_path", async () => {
    const mediaSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ media_id: null, upload_session_id: "sess-1" }],
        error: null,
      }),
    });
    const sessionsIn = vi.fn().mockResolvedValue({
      data: [{ id: "sess-1", object_path: "media/t1/sess-1/a.jpg", status: "finalized" }],
      error: null,
    });
    const sessionsSelect = vi.fn().mockReturnValue({ in: sessionsIn });
    const from = vi.fn((table: string) => {
      if (table === "worker_report_media") return { select: mediaSelect };
      if (table === "upload_sessions") return { select: sessionsSelect };
      throw new Error(`unexpected table ${table}`);
    });
    const supabase = { from } as never;

    const rows = await listMediaByReportIdWithUrls(supabase, "rpt-1", "t1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.file_url).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/t1/sess-1/a.jpg"
    );
    expect(rows[0]?.file_url).not.toContain("/media/media/");
  });
});
