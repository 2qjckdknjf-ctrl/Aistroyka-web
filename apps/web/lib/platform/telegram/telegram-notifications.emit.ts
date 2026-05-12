/**
 * Customer-safe Telegram notifications (Phase 10). No internal finance payloads.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import { getAppOriginForLinks } from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.delivery";
import { sendTelegramMessage } from "./telegram-api.client";
import { isTelegramBotConfigured } from "./telegram.config";
import {
  getTelegramChatForUser,
  insertDeliveryAudit,
  listProjectInternalNotifyUserIds,
} from "./telegram.repository";

async function sendAndAudit(
  admin: SupabaseClient,
  params: { tenantId: string; userId: string; kind: string; chatId: string; text: string }
): Promise<void> {
  const result = await sendTelegramMessage({ chatId: params.chatId, text: params.text });
  await insertDeliveryAudit(admin, {
    tenant_id: params.tenantId,
    recipient_user_id: params.userId,
    kind: params.kind,
    ok: result.ok,
    error_text: result.ok ? null : result.error,
  });
}

/** Stakeholders with linked Telegram receive the same safe copy as email (portal link only). */
export async function emitTelegramForClientRequestStakeholders(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    stakeholderUserIds: string[];
    title: string;
    projectName?: string;
  }
): Promise<void> {
  if (!isTelegramBotConfigured()) return;
  const origin = getAppOriginForLinks();
  const path = `/dashboard/projects/${params.projectId}/client`;
  const url = `${origin}${path}`;
  const pn = params.projectName ? `Project: ${params.projectName}\n\n` : "";
  const text = `${pn}A new request needs your input: "${params.title}".\n\nOpen the client portal:\n${url}`;

  for (const userId of params.stakeholderUserIds) {
    const chatId = await getTelegramChatForUser(admin, { tenantId: params.tenantId, userId });
    if (!chatId) continue;
    await sendAndAudit(admin, {
      tenantId: params.tenantId,
      userId,
      kind: "client_request_new_stakeholder",
      chatId,
      text,
    });
  }
}

/** Managers / owners on the project: lightweight alert without cost/margin data. */
export async function emitTelegramForClientRequestManagers(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    title: string;
    projectName?: string;
    /** Skip these user IDs (e.g. already notified as stakeholder). */
    excludeUserIds?: Set<string>;
  }
): Promise<void> {
  if (!isTelegramBotConfigured()) return;
  const origin = getAppOriginForLinks();
  const path = `/en/dashboard/projects/${params.projectId}/client`;
  const url = `${origin}${path}`;
  const pn = params.projectName ? `Project: ${params.projectName}\n` : "";
  const text = `${pn}New client request: "${params.title}".\n\nOpen client view:\n${url}`;

  const internalIds = await listProjectInternalNotifyUserIds(admin, {
    tenantId: params.tenantId,
    projectId: params.projectId,
  });
  const skip = params.excludeUserIds ?? new Set<string>();
  for (const userId of internalIds) {
    if (skip.has(userId)) continue;
    const chatId = await getTelegramChatForUser(admin, { tenantId: params.tenantId, userId });
    if (!chatId) continue;
    await sendAndAudit(admin, {
      tenantId: params.tenantId,
      userId,
      kind: "client_request_new_manager",
      chatId,
      text,
    });
  }
}

/** Call after email/in-app stakeholder notifications are recorded. Best-effort Telegram. */
export async function emitTelegramForNewClientRequest(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    title: string;
  }
): Promise<void> {
  const { data: proj } = await admin
    .from("projects")
    .select("name")
    .eq("id", params.projectId)
    .eq("tenant_id", params.tenantId)
    .maybeSingle();
  const projectName = (proj as { name?: string } | null)?.name ?? undefined;
  const stakeholders = await shRepo.listByProject(admin, params.tenantId, params.projectId);
  const stakeholderUserIds = stakeholders
    .filter((s) => s.status === "active" && s.user_id)
    .map((s) => s.user_id as string);
  await emitTelegramForClientRequestStakeholders(admin, {
    tenantId: params.tenantId,
    projectId: params.projectId,
    stakeholderUserIds,
    title: params.title,
    projectName,
  });
  await emitTelegramForClientRequestManagers(admin, {
    tenantId: params.tenantId,
    projectId: params.projectId,
    title: params.title,
    projectName,
    excludeUserIds: new Set(stakeholderUserIds),
  });
}
