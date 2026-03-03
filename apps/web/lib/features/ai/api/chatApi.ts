/**
 * P2.1: Server-side chat — call Edge aistroyka-ai-chat (list_threads, get_thread, create_thread, archive_thread, send_chat_message).
 */

import { getPublicEnv } from "@/lib/env";
import type { DecisionContextPayload } from "@/lib/engine/types";

const getChatUrl = () => {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const base = (NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/functions/v1/aistroyka-ai-chat` : "";
};

async function chatFetch(
  body: Record<string, unknown>,
  getAuthToken: () => Promise<string | null>
) {
  const url = getChatUrl();
  if (!url) throw new Error("AI chat endpoint not configured");
  const token = await getAuthToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error((data.error as string) ?? res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as { data?: unknown; error?: string };
}

export interface ServerThreadRow {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  status: string;
}

export interface ServerMessageRow {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  request_id: string | null;
  error_kind: string | null;
  low_confidence: boolean;
  created_at: string;
}

export async function listThreads(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  limit = 20
) {
  const out = await chatFetch(
    { action: "list_threads", project_id: projectId, limit },
    getAuthToken
  );
  return (out.data as ServerThreadRow[]) ?? [];
}

export async function getThread(
  threadId: string,
  getAuthToken: () => Promise<string | null>,
  messagesLimit = 50
) {
  const out = await chatFetch(
    { action: "get_thread", thread_id: threadId, messages_limit: messagesLimit },
    getAuthToken
  );
  const d = out.data as { thread: ServerThreadRow; messages: ServerMessageRow[] } | undefined;
  if (!d) throw new Error("Thread not found");
  return d;
}

export async function createThread(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  title?: string | null
) {
  const out = await chatFetch(
    { action: "create_thread", project_id: projectId, title: title ?? null },
    getAuthToken
  );
  const thread = out.data as ServerThreadRow & { id: string };
  if (!thread?.id) throw new Error("Create thread failed");
  return thread;
}

export async function archiveThread(
  threadId: string,
  getAuthToken: () => Promise<string | null>
) {
  await chatFetch({ action: "archive_thread", thread_id: threadId }, getAuthToken);
}

export interface SendChatMessageResult {
  ok: boolean;
  thread_id: string;
  request_id: string;
  assistant_content: string;
  low_confidence: boolean;
  fallback_reason: string | null;
  error_category: string | null;
  /** Memory v1: thread summary was included in context. */
  memory_summary_used?: boolean;
  /** Memory v1: number of memory chunks injected. */
  memory_chunks_count?: number;
}

export async function sendChatMessage(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  params: {
    thread_id?: string | null;
    user_text: string;
    decision_context: DecisionContextPayload;
    locale?: string | null;
  }
): Promise<SendChatMessageResult> {
  const out = await chatFetch(
    {
      action: "send_chat_message",
      project_id: projectId,
      thread_id: params.thread_id ?? null,
      user_text: params.user_text,
      decision_context: params.decision_context,
      locale: params.locale ?? null,
    },
    getAuthToken
  );
  const data = out.data as SendChatMessageResult;
  if (!data) throw new Error("Send message failed");
  return data;
}

export interface ThreadSummaryRow {
  thread_id: string;
  summary: string;
  key_facts: unknown;
  last_summarized_message_at: string;
  updated_at: string;
}

export async function getThreadSummary(
  threadId: string,
  getAuthToken: () => Promise<string | null>
): Promise<ThreadSummaryRow | null> {
  const out = await chatFetch(
    { action: "get_thread_summary", thread_id: threadId },
    getAuthToken
  );
  return (out.data as ThreadSummaryRow | null) ?? null;
}

export async function requestMemoryRefresh(
  threadId: string,
  getAuthToken: () => Promise<string | null>
): Promise<void> {
  await chatFetch(
    { action: "request_memory_refresh", thread_id: threadId },
    getAuthToken
  );
}
