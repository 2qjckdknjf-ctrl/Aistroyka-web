import type { TaskMessageKind } from "./task-messages.types";

/** Chat media MIME allow-list and size caps (bytes). */
export const CHAT_MEDIA_LIMITS = {
  image: {
    maxBytes: 15 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/jpg"] as const,
  },
  voice: {
    maxBytes: 5 * 1024 * 1024,
    maxDurationMs: 120_000,
    mimes: ["audio/m4a", "audio/mp4", "audio/x-m4a", "audio/aac"] as const,
  },
  video: {
    maxBytes: 50 * 1024 * 1024,
    mimes: ["video/mp4", "video/quicktime"] as const,
  },
} as const;

export function normalizeMime(mime: string | null | undefined): string {
  return (mime ?? "").trim().toLowerCase();
}

export function mimeMatchesKind(kind: Exclude<TaskMessageKind, "text">, mime: string | null | undefined): boolean {
  const m = normalizeMime(mime);
  if (!m) return false;
  const allowed = CHAT_MEDIA_LIMITS[kind].mimes as readonly string[];
  return allowed.includes(m);
}

export function sizeWithinLimit(
  kind: Exclude<TaskMessageKind, "text">,
  sizeBytes: number | null | undefined
): boolean {
  // Reject omitted size — otherwise large uploads can bypass caps.
  if (sizeBytes == null) return false;
  return sizeBytes >= 0 && sizeBytes <= CHAT_MEDIA_LIMITS[kind].maxBytes;
}

export function durationWithinLimit(durationMs: number | null | undefined): boolean {
  if (durationMs == null) return true;
  return durationMs >= 0 && durationMs <= CHAT_MEDIA_LIMITS.voice.maxDurationMs;
}

/** Upload session purposes allowed for task chat attachments. */
export const CHAT_UPLOAD_PURPOSES = ["task_chat"] as const;
export type ChatUploadPurpose = (typeof CHAT_UPLOAD_PURPOSES)[number];

export function isChatUploadPurpose(purpose: string): boolean {
  return (CHAT_UPLOAD_PURPOSES as readonly string[]).includes(purpose);
}
