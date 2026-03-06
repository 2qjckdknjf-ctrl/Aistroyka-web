import type { SupabaseClient } from "@supabase/supabase-js";
import type { UploadSession, UploadSessionPurpose } from "./upload-session.types";

const DEFAULT_EXPIRY_MINUTES = 60;

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  purpose: UploadSessionPurpose
): Promise<UploadSession | null> {
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("upload_sessions")
    .insert({ tenant_id: tenantId, user_id: userId, purpose, status: "created", expires_at: expiresAt })
    .select("id, tenant_id, user_id, purpose, status, object_path, mime_type, size_bytes, created_at, expires_at")
    .single();
  if (error || !data) return null;
  return data as UploadSession;
}

export const BOOTSTRAP_SESSION_COLS = "id, status, created_at, purpose" as const;

export async function listForBootstrap(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  limit: number = 100
): Promise<{ id: string; status: string; created_at: string; purpose: string }[]> {
  const { data, error } = await supabase
    .from("upload_sessions")
    .select(BOOTSTRAP_SESSION_COLS)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as { id: string; status: string; created_at: string; purpose: string }[];
}

const DEFAULT_STUCK_HOURS = 4;

export interface UploadSessionListRow {
  id: string;
  tenant_id: string;
  user_id: string;
  purpose: string;
  status: string;
  created_at: string;
  expires_at: string;
}

/** List upload sessions for manager (tenant-scoped, paginated). Optional filter by status, user_id, from, to; stuck = status in (created,uploaded) and created_at older than stuckHours. */
export async function listForManager(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { limit?: number; offset?: number; status?: string; stuck?: boolean; stuckHours?: number; userId?: string; from?: string; to?: string } = {}
): Promise<{ rows: UploadSessionListRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = opts.offset ?? 0;
  const stuckHours = Math.max(1, Math.min(168, opts.stuckHours ?? DEFAULT_STUCK_HOURS));

  let query = supabase
    .from("upload_sessions")
    .select("id, tenant_id, user_id, purpose, status, created_at, expires_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.userId) query = query.eq("user_id", opts.userId);
  if (opts.from) query = query.gte("created_at", opts.from);
  if (opts.to) query = query.lte("created_at", opts.to);
  if (opts.stuck) {
    const stuckSince = new Date(Date.now() - stuckHours * 60 * 60 * 1000).toISOString();
    query = query.in("status", ["created", "uploaded"]).lt("created_at", stuckSince);
  }

  const { data: rows, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return { rows: [], total: 0 };
  return { rows: (rows ?? []) as UploadSessionListRow[], total: count ?? 0 };
}

export async function getById(
  supabase: SupabaseClient,
  sessionId: string,
  tenantId: string
): Promise<UploadSession | null> {
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("id, tenant_id, user_id, purpose, status, object_path, mime_type, size_bytes, created_at, expires_at")
    .eq("id", sessionId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UploadSession;
}

export async function finalize(
  supabase: SupabaseClient,
  sessionId: string,
  tenantId: string,
  userId: string,
  payload: { object_path: string; mime_type?: string; size_bytes?: number }
): Promise<boolean> {
  const { data: row } = await supabase
    .from("upload_sessions")
    .select("id, user_id, status, expires_at, object_path")
    .eq("id", sessionId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!row || (row as { user_id: string }).user_id !== userId) return false;
  const r = row as { status: string; expires_at: string; object_path: string | null };
  if (r.status === "finalized" && r.object_path === payload.object_path) return true;
  if (r.status !== "created" && r.status !== "uploaded") return false;
  if (new Date(r.expires_at) < new Date()) return false;
  const { error } = await supabase
    .from("upload_sessions")
    .update({
      status: "finalized",
      object_path: payload.object_path,
      mime_type: payload.mime_type ?? null,
      size_bytes: payload.size_bytes ?? null,
    })
    .eq("id", sessionId)
    .eq("tenant_id", tenantId);
  return !error;
}
