import { describe, expect, it } from "vitest";
import {
  CHAT_MEDIA_LIMITS,
  durationWithinLimit,
  mimeMatchesKind,
  sizeWithinLimit,
} from "./task-messages.media";

describe("task-messages.media", () => {
  it("accepts voice m4a mime", () => {
    expect(mimeMatchesKind("voice", "audio/m4a")).toBe(true);
    expect(mimeMatchesKind("voice", "audio/mp4")).toBe(true);
    expect(mimeMatchesKind("voice", "image/jpeg")).toBe(false);
  });

  it("accepts video mp4 and image jpeg", () => {
    expect(mimeMatchesKind("video", "video/mp4")).toBe(true);
    expect(mimeMatchesKind("image", "image/jpeg")).toBe(true);
    expect(mimeMatchesKind("image", "video/mp4")).toBe(false);
  });

  it("enforces size and duration caps", () => {
    expect(sizeWithinLimit("voice", CHAT_MEDIA_LIMITS.voice.maxBytes)).toBe(true);
    expect(sizeWithinLimit("voice", CHAT_MEDIA_LIMITS.voice.maxBytes + 1)).toBe(false);
    expect(durationWithinLimit(CHAT_MEDIA_LIMITS.voice.maxDurationMs)).toBe(true);
    expect(durationWithinLimit(CHAT_MEDIA_LIMITS.voice.maxDurationMs + 1)).toBe(false);
  });
});
