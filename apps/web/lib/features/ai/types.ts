/**
 * P2: AI conversation (chat) data model.
 */

import type { EngineErrorKind } from "@/lib/engine/errors";

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string; // ISO
  /** Set for assistant messages from engine (authoritative). */
  requestId?: string;
  /** When groundedness_passed === false or retrieval_low_confidence === true. */
  lowConfidence?: boolean;
  /** When assistant message failed. */
  errorKind?: EngineErrorKind;
  /** For diagnostics (assistant). */
  fallback_reason?: string | null;
  error_category?: string | null;
}

export interface ChatThread {
  projectId: string;
  messages: ChatMessage[];
  /** P2.1: Server thread id when using server history. */
  threadId?: string;
}
