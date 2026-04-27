import { describe, it, expect } from "vitest";
import { inferAudioMimeFromBytes } from "./audio-sniff";

describe("inferAudioMimeFromBytes", () => {
  it("detects WebM EBML header", () => {
    const b = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(inferAudioMimeFromBytes(b)).toBe("audio/webm");
  });

  it("detects Ogg", () => {
    const b = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(inferAudioMimeFromBytes(b)).toBe("audio/ogg");
  });

  it("returns null for empty or short input", () => {
    expect(inferAudioMimeFromBytes(new Uint8Array(0))).toBeNull();
    expect(inferAudioMimeFromBytes(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
