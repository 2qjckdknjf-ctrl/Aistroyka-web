import type { SupabaseClient } from "@supabase/supabase-js";

export interface CopilotThreadRow {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  status: string;
}

export interface CopilotMessageRow {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  request_id: string | null;
  error_kind: string | null;
  low_confidence: boolean;
  created_at: string;
}

const THREAD_SELECT =
  "id, project_id, title, created_at, updated_at, last_message_at, status";
const MESSAGE_SELECT =
  "id, thread_id, role, content, request_id, error_kind, created_at";

function clampLimit(value: number, fallback: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(max, Math.trunc(value)));
}

export async function listCopilotThreads(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  projectId: string,
  limit = 20
): Promise<{ data: CopilotThreadRow[]; error: string }> {
  const safeLimit = clampLimit(limit, 20, 50);
  const { data, error } = await supabase
    .from("ai_chat_threads")
    .select(THREAD_SELECT)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("created_by", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) return { data: [], error: error.message || "Failed to list chat threads" };
  return { data: (data ?? []) as CopilotThreadRow[], error: "" };
}

export async function getCopilotThread(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  projectId: string,
  threadId: string,
  messagesLimit = 50
): Promise<{
  data: { thread: CopilotThreadRow; messages: CopilotMessageRow[] } | null;
  error: string;
}> {
  const { data: thread, error: threadError } = await supabase
    .from("ai_chat_threads")
    .select(THREAD_SELECT)
    .eq("id", threadId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("created_by", userId)
    .maybeSingle();

  if (threadError) {
    return { data: null, error: threadError.message || "Failed to load chat thread" };
  }
  if (!thread) return { data: null, error: "Not found" };

  const safeLimit = clampLimit(messagesLimit, 50, 200);
  const { data: messageRows, error: messageError } = await supabase
    .from("ai_chat_messages")
    .select(MESSAGE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (messageError) {
    return { data: null, error: messageError.message || "Failed to load chat messages" };
  }

  // Production schema does not currently contain the historical `low_confidence`
  // column documented by the removed Edge implementation. Preserve the web contract
  // without selecting a non-existent database column.
  const messages = [...(messageRows ?? [])]
    .reverse()
    .map((row) => ({
      ...(row as Omit<CopilotMessageRow, "low_confidence">),
      low_confidence: false,
    }));

  return {
    data: {
      thread: thread as CopilotThreadRow,
      messages,
    },
    error: "",
  };
}

export async function createCopilotThread(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  projectId: string,
  title?: string | null
): Promise<{ data: CopilotThreadRow | null; error: string }> {
  const normalizedTitle = title?.trim().slice(0, 160) || null;
  const { data, error } = await supabase
    .from("ai_chat_threads")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      created_by: userId,
      title: normalizedTitle,
      status: "active",
    })
    .select(THREAD_SELECT)
    .single();

  if (error || !data) {
    return { data: null, error: error?.message || "Failed to create chat thread" };
  }
  return { data: data as CopilotThreadRow, error: "" };
}

export async function archiveCopilotThread(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  projectId: string,
  threadId: string
): Promise<{ ok: boolean; error: string }> {
  const { data, error } = await supabase
    .from("ai_chat_threads")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("created_by", userId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message || "Failed to archive chat thread" };
  if (!data) return { ok: false, error: "Not found" };
  return { ok: true, error: "" };
}
