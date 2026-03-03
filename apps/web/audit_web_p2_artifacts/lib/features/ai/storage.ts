/**
 * P2: Client-side persistence for copilot chat thread per project.
 * localStorage key: copilot_thread_<projectId>
 * Cap: last 50 messages. "Clear chat" removes thread for project.
 */

import type { ChatThread, ChatMessage } from "./types";

const PREFIX = "copilot_thread_";
const MAX_MESSAGES = 50;

function storageKey(projectId: string): string {
  return `${PREFIX}${projectId}`;
}

export function getThread(projectId: string): ChatThread | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatThread;
    if (!parsed?.projectId || !Array.isArray(parsed.messages)) return null;
    return {
      projectId: parsed.projectId,
      messages: parsed.messages.slice(-MAX_MESSAGES),
    };
  } catch {
    return null;
  }
}

export function saveThread(thread: ChatThread): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed: ChatThread = {
      projectId: thread.projectId,
      messages: thread.messages.slice(-MAX_MESSAGES),
    };
    window.localStorage.setItem(storageKey(thread.projectId), JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function clearThread(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(projectId));
  } catch {
    // ignore
  }
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
