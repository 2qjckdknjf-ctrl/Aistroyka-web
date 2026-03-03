/**
 * P2.1: Client-side storage — draft input only.
 * Server is source of truth for thread/messages (see chatApi + useCopilotThread).
 */

const DRAFT_PREFIX = "copilot_draft_";

function draftKey(projectId: string): string {
  return `${DRAFT_PREFIX}${projectId}`;
}

export function getDraft(projectId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(draftKey(projectId)) ?? "";
  } catch {
    return "";
  }
}

export function setDraft(projectId: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!value) window.localStorage.removeItem(draftKey(projectId));
    else window.localStorage.setItem(draftKey(projectId), value);
  } catch {
    // ignore
  }
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
