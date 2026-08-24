import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateTaskMessageInput, TaskMessage, TaskMessageKind } from "./task-messages.types";

const MESSAGE_SELECT =
  "id, tenant_id, project_id, task_id, sender_user_id, kind, body, upload_session_id, duration_ms, client_id, created_at, edited_at, deleted_at";

type MessageRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  task_id: string;
  sender_user_id: string;
  kind: TaskMessageKind;
  body: string | null;
  upload_session_id: string | null;
  duration_ms: number | null;
  client_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

function mapRow(
  row: MessageRow,
  extra?: {
    mime_type?: string | null;
    object_path?: string | null;
    size_bytes?: number | null;
    media_url?: string | null;
  }
): TaskMessage {
  return {
    ...row,
    mime_type: extra?.mime_type ?? null,
    object_path: extra?.object_path ?? null,
    size_bytes: extra?.size_bytes ?? null,
    media_url: extra?.media_url ?? null,
  };
}

function quoteFilterValue(value: string): string {
  // PostgREST: quote values that contain reserved characters (e.g. + in timestamps).
  if (/[^a-zA-Z0-9._-]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function pathInMediaBucket(objectPath: string): string {
  return objectPath.startsWith("media/") ? objectPath.slice("media/".length) : objectPath;
}

/** Encode cursor as base64url of `created_at|id`. */
export function encodeMessageCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

export function decodeMessageCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const pipe = raw.indexOf("|");
    if (pipe <= 0) return null;
    const createdAt = raw.slice(0, pipe);
    const id = raw.slice(pipe + 1);
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * Convert a newest-first DB page into ascending display order (oldest→newest
 * within the latest window). Pure helper for chat "tail" loads.
 */
export function materializeTailPage<T>(
  newestFirstRows: T[],
  limit: number
): { page: T[]; hasOlder: boolean } {
  const hasOlder = newestFirstRows.length > limit;
  const windowNewestFirst = newestFirstRows.slice(0, limit);
  return { page: [...windowNewestFirst].reverse(), hasOlder };
}

export async function listByTask(
  supabase: SupabaseClient,
  tenantId: string,
  taskId: string,
  opts: { limit: number; cursor?: string | null; tail?: boolean }
): Promise<{ data: TaskMessage[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit, 1), 100);
  const tail = opts.tail === true;

  // Tail mode: return the newest `limit` rows (ascending within the window) so
  // chat UIs open on recent conversation instead of the oldest page.
  // Forward `cursor` is ignored in tail mode (iOS oldest→newest paging unchanged).
  let query = supabase
    .from("task_messages")
    .select(MESSAGE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("task_id", taskId)
    .is("deleted_at", null)
    .order("created_at", { ascending: !tail })
    .order("id", { ascending: !tail })
    .limit(limit + 1);

  if (!tail && opts.cursor) {
    const decoded = decodeMessageCursor(opts.cursor);
    if (decoded) {
      const ts = quoteFilterValue(decoded.createdAt);
      const id = quoteFilterValue(decoded.id);
      // Rows strictly after cursor (created_at, id)
      query = query.or(`created_at.gt.${ts},and(created_at.eq.${ts},id.gt.${id})`);
    }
  }

  const { data, error } = await query;
  if (error || !data) return { data: [], nextCursor: null };

  const rows = data as MessageRow[];
  let page: MessageRow[];
  let nextCursor: string | null = null;

  if (tail) {
    const materialised = materializeTailPage(rows, limit);
    page = materialised.page;
    // No older-history cursor yet — chat panel only needs the latest window.
    nextCursor = null;
  } else {
    page = rows.slice(0, limit);
    const last = page[page.length - 1];
    nextCursor =
      rows.length > limit && last ? encodeMessageCursor(last.created_at, last.id) : null;
  }

  const enriched = await attachUploadMeta(
    supabase,
    tenantId,
    page.map((row) => mapRow(row))
  );
  return { data: enriched, nextCursor };
}

async function attachUploadMeta(
  supabase: SupabaseClient,
  tenantId: string,
  messages: TaskMessage[]
): Promise<TaskMessage[]> {
  const sessionIds = [
    ...new Set(messages.map((m) => m.upload_session_id).filter((id): id is string => !!id)),
  ];
  if (sessionIds.length === 0) return messages;
  const { data } = await supabase
    .from("upload_sessions")
    .select("id, mime_type, object_path, size_bytes")
    .eq("tenant_id", tenantId)
    .in("id", sessionIds);
  const byId = new Map(
    (
      (data ?? []) as {
        id: string;
        mime_type: string | null;
        object_path: string | null;
        size_bytes: number | null;
      }[]
    ).map((r) => [r.id, r])
  );

  const signedBySession = new Map<string, string>();
  await Promise.all(
    [...byId.entries()].map(async ([sessionId, meta]) => {
      if (!meta.object_path) return;
      try {
        const path = pathInMediaBucket(meta.object_path);
        const { data: signed, error } = await supabase.storage
          .from("media")
          .createSignedUrl(path, 3600);
        if (!error && signed?.signedUrl) signedBySession.set(sessionId, signed.signedUrl);
      } catch {
        // best-effort; clients still see kind/caption
      }
    })
  );

  return messages.map((m) => {
    if (!m.upload_session_id) return m;
    const meta = byId.get(m.upload_session_id);
    if (!meta) return m;
    return {
      ...m,
      mime_type: meta.mime_type,
      object_path: meta.object_path,
      size_bytes: meta.size_bytes,
      media_url: signedBySession.get(m.upload_session_id) ?? null,
    };
  });
}

export async function getByClientId(
  supabase: SupabaseClient,
  tenantId: string,
  taskId: string,
  senderUserId: string,
  clientId: string
): Promise<TaskMessage | null> {
  const { data, error } = await supabase
    .from("task_messages")
    .select(MESSAGE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("task_id", taskId)
    .eq("sender_user_id", senderUserId)
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const mapped = mapRow(data as MessageRow);
  const [enriched] = await attachUploadMeta(supabase, tenantId, [mapped]);
  return enriched ?? mapped;
}

export async function getById(
  supabase: SupabaseClient,
  tenantId: string,
  messageId: string
): Promise<TaskMessage | null> {
  const { data, error } = await supabase
    .from("task_messages")
    .select(MESSAGE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", messageId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as MessageRow);
}

export async function insert(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    task_id: string;
    sender_user_id: string;
    kind: TaskMessageKind;
    body: string | null;
    upload_session_id: string | null;
    duration_ms: number | null;
    client_id: string | null;
  }
): Promise<TaskMessage | null> {
  const { data, error } = await supabase
    .from("task_messages")
    .insert(row)
    .select(MESSAGE_SELECT)
    .single();
  if (error || !data) return null;
  const mapped = mapRow(data as MessageRow);
  const [enriched] = await attachUploadMeta(supabase, row.tenant_id, [mapped]);
  return enriched ?? mapped;
}

export async function softDelete(
  supabase: SupabaseClient,
  tenantId: string,
  messageId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("task_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", messageId)
    .is("deleted_at", null);
  return !error;
}

export async function getFinalizedUploadSession(
  supabase: SupabaseClient,
  tenantId: string,
  sessionId: string,
  userId: string
): Promise<{ id: string; mime_type: string | null; size_bytes: number | null; purpose: string } | null> {
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("id, mime_type, size_bytes, purpose, status, user_id")
    .eq("tenant_id", tenantId)
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    mime_type: string | null;
    size_bytes: number | null;
    purpose: string;
    status: string;
    user_id: string;
  };
  if (row.status !== "finalized") return null;
  if (row.user_id !== userId) return null;
  return {
    id: row.id,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    purpose: row.purpose,
  };
}

export type { CreateTaskMessageInput };
