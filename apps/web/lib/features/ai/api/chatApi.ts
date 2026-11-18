import type { DecisionContextPayload } from "@/lib/engine/types";

async function apiChatFetch(
  path: string,
  getAuthToken: () => Promise<string | null>,
  init: { method?: string; body?: unknown } = {}
) {
  const token = await getAuthToken();
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error((data.error as string) ?? res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as { data?: unknown; error?: string; ok?: boolean };
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

function projectChatBase(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/copilot/chat`;
}

export async function listThreads(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  limit = 20
) {
  const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit || 20)));
  const out = await apiChatFetch(
    `${projectChatBase(projectId)}/threads?limit=${safeLimit}`,
    getAuthToken
  );
  return (out.data as ServerThreadRow[]) ?? [];
}

export async function getThread(
  projectId: string,
  threadId: string,
  getAuthToken: () => Promise<string | null>,
  messagesLimit = 50
) {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(messagesLimit || 50)));
  const out = await apiChatFetch(
    `${projectChatBase(projectId)}/threads/${encodeURIComponent(threadId)}?messages_limit=${safeLimit}`,
    getAuthToken
  );
  const data = out.data as { thread: ServerThreadRow; messages: ServerMessageRow[] } | undefined;
  if (!data) throw new Error("Thread not found");
  return data;
}

export async function createThread(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  title?: string | null
) {
  const out = await apiChatFetch(`${projectChatBase(projectId)}/threads`, getAuthToken, {
    method: "POST",
    body: { title: title ?? null },
  });
  const thread = out.data as ServerThreadRow & { id: string };
  if (!thread?.id) throw new Error("Create thread failed");
  return thread;
}

export async function archiveThread(
  projectId: string,
  threadId: string,
  getAuthToken: () => Promise<string | null>
) {
  await apiChatFetch(
    `${projectChatBase(projectId)}/threads/${encodeURIComponent(threadId)}`,
    getAuthToken,
    { method: "PATCH", body: { status: "archived" } }
  );
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

export interface StreamCallbacks {
  onToken: (delta: string) => void;
  onDone: (result: { thread_id: string; request_id: string; final_text: string }) => void;
  onError: (err: { request_id: string; retryable: boolean; message: string }) => void;
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
  return sendChatMessageStream(
    projectId,
    getAuthToken,
    params,
    {
      onToken: () => {},
      onDone: () => {},
      onError: () => {},
    }
  );
}

/**
 * Send through the same-origin Next.js streaming route.
 * The server route already provides deterministic fallback for provider failures.
 * If server AI configuration itself is unavailable, fail explicitly instead of
 * falling back to the removed/non-deployed `aistroyka-ai-chat` Edge Function.
 */
export async function sendChatMessageStream(
  projectId: string,
  getAuthToken: () => Promise<string | null>,
  params: {
    thread_id?: string | null;
    user_text: string;
    decision_context: DecisionContextPayload;
    locale?: string | null;
    signal?: AbortSignal | null;
  },
  callbacks: StreamCallbacks
): Promise<SendChatMessageResult> {
  const token = await getAuthToken();
  const url = `${projectChatBase(projectId)}/stream`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      thread_id: params.thread_id ?? null,
      user_text: params.user_text,
      decision_context: params.decision_context,
      locale: params.locale ?? null,
    }),
    signal: params.signal ?? undefined,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { request_id?: string; error?: string };
    const requestId = data.request_id ?? "";
    const message = data.error ?? "Stream request failed";
    callbacks.onError({
      request_id: requestId,
      retryable: res.status >= 500,
      message,
    });
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const error = new Error("Streaming response body unavailable");
    callbacks.onError({ request_id: "", retryable: true, message: error.message });
    throw error;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let requestId = "";
  let threadId = "";
  let finalText = "";
  let fallbackReason: string | null = null;
  let currentEvent = "";
  let streamErrorReported = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }
        if (!line.startsWith("data: ")) continue;

        const dataStr = line.slice(6);
        let data: unknown;
        try {
          data = JSON.parse(dataStr);
        } catch {
          continue;
        }
        const obj = data as Record<string, unknown>;
        if (obj.request_id) requestId = String(obj.request_id);
        if (obj.thread_id) threadId = String(obj.thread_id);

        if (currentEvent === "meta") continue;
        if (currentEvent === "token" && obj.delta != null) {
          const delta = String(obj.delta);
          finalText += delta;
          callbacks.onToken(delta);
        }
        if (currentEvent === "done" && obj.final_text != null) {
          finalText = String(obj.final_text);
          fallbackReason =
            typeof obj.fallback_reason === "string" ? String(obj.fallback_reason) : null;
          callbacks.onDone({ thread_id: threadId, request_id: requestId, final_text: finalText });
          return {
            ok: true,
            thread_id: threadId,
            request_id: requestId,
            assistant_content: finalText,
            low_confidence: false,
            fallback_reason: fallbackReason,
            error_category: null,
          };
        }
        if (currentEvent === "error") {
          const message = String(obj.message ?? "Stream error");
          streamErrorReported = true;
          callbacks.onError({
            request_id: requestId,
            retryable: Boolean(obj.retryable),
            message,
          });
          throw new Error(message);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (!streamErrorReported) {
      callbacks.onError({
        request_id: requestId,
        retryable: true,
        message: error instanceof Error ? error.message || "Stream parse failed" : "Stream parse failed",
      });
    }
    throw error;
  }

  if (!finalText) {
    const error = new Error("Stream ended without a final response");
    callbacks.onError({ request_id: requestId, retryable: true, message: error.message });
    throw error;
  }

  callbacks.onDone({ thread_id: threadId, request_id: requestId, final_text: finalText });
  return {
    ok: true,
    thread_id: threadId,
    request_id: requestId,
    assistant_content: finalText,
    low_confidence: false,
    fallback_reason: fallbackReason,
    error_category: null,
  };
}
