/**
 * Best-effort audio container sniffing from the first bytes (when browser sends empty MIME).
 */

const MIN_SNIFF = 16;

export function inferAudioMimeFromBytes(head: Uint8Array): string | null {
  if (head.length < MIN_SNIFF) return null;
  const a0 = head[0]!;
  const a1 = head[1]!;
  const a2 = head[2]!;
  const a3 = head[3]!;

  // WebM / Matroska EBML header
  if (a0 === 0x1a && a1 === 0x45 && a2 === 0xdf && a3 === 0xa3) return "audio/webm";

  // Ogg
  if (a0 === 0x4f && a1 === 0x67 && a2 === 0x67 && a3 === 0x53) return "audio/ogg";

  // FLAC
  if (a0 === 0x66 && a1 === 0x4c && a2 === 0x61 && a3 === 0x43) return "audio/flac";

  // RIFF WAVE
  if (a0 === 0x52 && a1 === 0x49 && a2 === 0x46 && a3 === 0x46) return "audio/wav";

  // MP3 ID3 tag
  if (a0 === 0x49 && a1 === 0x44 && a2 === 0x33) return "audio/mpeg";

  // MP3 frame sync (common)
  if (a0 === 0xff && (a1 & 0xe0) === 0xe0) return "audio/mpeg";

  // ISO BMFF (mp4/m4a) — size(4) + "ftyp"
  if (head.length >= 8 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    return "audio/mp4";
  }

  return null;
}
