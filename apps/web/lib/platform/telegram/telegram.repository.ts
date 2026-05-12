import type { SupabaseClient } from "@supabase/supabase-js";

const TOKEN_BYTES = 16;
const LINK_TTL_MS = 15 * 60 * 1000;

export function mintLinkToken(): string {
  const buf = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function insertLinkToken(
  admin: SupabaseClient,
  params: { tenantId: string; userId: string; token: string; expiresAtIso: string }
): Promise<boolean> {
  const { error } = await admin.from("telegram_link_tokens").insert({
    token: params.token,
    tenant_id: params.tenantId,
    user_id: params.userId,
    expires_at: params.expiresAtIso,
  });
  return !error;
}

export async function consumeLinkToken(
  admin: SupabaseClient,
  token: string
): Promise<{ tenantId: string; userId: string } | null> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("telegram_link_tokens")
    .select("tenant_id, user_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { tenant_id: string; user_id: string; expires_at: string };
  if (row.expires_at < now) {
    await admin.from("telegram_link_tokens").delete().eq("token", token);
    return null;
  }
  await admin.from("telegram_link_tokens").delete().eq("token", token);
  return { tenantId: row.tenant_id, userId: row.user_id };
}

/** Replace any existing link for this Supabase user or this Telegram account. */
export async function replaceUserTelegramLink(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    userId: string;
    telegramUserId: string;
    telegramChatId: string;
  }
): Promise<boolean> {
  const now = new Date().toISOString();
  await admin.from("user_telegram_links").delete().eq("telegram_user_id", params.telegramUserId);
  await admin.from("user_telegram_links").delete().eq("tenant_id", params.tenantId).eq("user_id", params.userId);
  const { error } = await admin.from("user_telegram_links").insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    telegram_user_id: params.telegramUserId,
    telegram_chat_id: params.telegramChatId,
    created_at: now,
    updated_at: now,
  });
  return !error;
}

export async function deleteUserTelegramLink(
  admin: SupabaseClient,
  params: { tenantId: string; userId: string }
): Promise<boolean> {
  const { error } = await admin
    .from("user_telegram_links")
    .delete()
    .eq("tenant_id", params.tenantId)
    .eq("user_id", params.userId);
  return !error;
}

export async function getTelegramChatForUser(
  admin: SupabaseClient,
  params: { tenantId: string; userId: string }
): Promise<string | null> {
  const { data, error } = await admin
    .from("user_telegram_links")
    .select("telegram_chat_id")
    .eq("tenant_id", params.tenantId)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { telegram_chat_id: string }).telegram_chat_id ?? null;
}

export async function listProjectInternalNotifyUserIds(
  admin: SupabaseClient,
  params: { tenantId: string; projectId: string }
): Promise<string[]> {
  const { data, error } = await admin
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", params.tenantId)
    .eq("project_id", params.projectId)
    .eq("status", "active")
    .in("role", ["manager", "owner"]);
  if (error || !data) return [];
  const rows = data as { user_id: string }[];
  return [...new Set(rows.map((r) => r.user_id))];
}

export async function insertDeliveryAudit(
  admin: SupabaseClient,
  row: {
    tenant_id: string | null;
    recipient_user_id: string | null;
    kind: string;
    ok: boolean;
    error_text: string | null;
  }
): Promise<void> {
  await admin.from("telegram_delivery_audit").insert({
    tenant_id: row.tenant_id,
    recipient_user_id: row.recipient_user_id,
    kind: row.kind,
    ok: row.ok,
    error_text: row.error_text,
  });
}

export function computeLinkExpiryIso(): string {
  return new Date(Date.now() + LINK_TTL_MS).toISOString();
}
