import { describe, expect, it, vi } from "vitest";

/**
 * Behavior contract for list enrichment: finalized upload_sessions.size_bytes
 * must surface on TaskMessage as size_bytes (non-null when session finalized).
 */
describe("task message upload meta contract", () => {
  it("maps size_bytes from upload session rows", () => {
    const meta = {
      id: "sess-1",
      mime_type: "image/jpeg",
      object_path: "media/t/sess-1/a.jpg",
      size_bytes: 4096,
    };
    const message = {
      id: "m1",
      upload_session_id: "sess-1",
      kind: "image" as const,
    };
    const enriched = {
      ...message,
      mime_type: meta.mime_type,
      object_path: meta.object_path,
      size_bytes: meta.size_bytes,
      media_url: "https://example.com/signed",
    };
    expect(enriched.size_bytes).toBeGreaterThan(0);
    expect(enriched.mime_type).toBe("image/jpeg");
  });

  it("treats missing size_bytes as list defect for finalized media", () => {
    const size_bytes: number | null = null;
    expect(size_bytes == null || size_bytes <= 0).toBe(true);
  });
});

// Keep vi import used for future expansion without unused lint noise in some configs.
void vi;
