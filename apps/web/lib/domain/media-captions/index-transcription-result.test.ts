import { describe, expect, it, vi } from "vitest";
import { indexTranscriptionResult } from "./index-transcription-result";

vi.mock("./media-caption-index.service", () => ({
  replaceMediaCaptionSegments: vi.fn(),
}));

import { replaceMediaCaptionSegments } from "./media-caption-index.service";

describe("indexTranscriptionResult", () => {
  it("maps successful replace into indexed summary", async () => {
    vi.mocked(replaceMediaCaptionSegments).mockResolvedValueOnce({
      ok: true,
      inserted: 2,
    });
    const out = await indexTranscriptionResult({} as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m1",
      actorUserId: "u1",
      result: {
        text: "hello",
        segments: [{ startSeconds: 0, endSeconds: 1, text: "hello" }],
      },
    });
    expect(out).toEqual({ indexed: true, inserted: 2 });
  });

  it("returns code when replace fails", async () => {
    vi.mocked(replaceMediaCaptionSegments).mockResolvedValueOnce({
      ok: false,
      error: "x",
      code: "INSERT_FAILED",
    });
    const out = await indexTranscriptionResult({} as never, {
      tenantId: "t1",
      projectId: "p1",
      mediaId: "m1",
      actorUserId: "u1",
      result: { text: "hello", segments: [] },
    });
    expect(out).toEqual({ indexed: false, inserted: 0, code: "INSERT_FAILED" });
  });
});
