/**
 * Cron-driven reminders for Wave 4 Step 8 (no separate scheduler product).
 * Uses service-role client only; idempotent via hasRecent* guards.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import {
  emitClientRequestReminderForStakeholders,
  emitInviteReminderIfConfigured,
} from "./stakeholder-notifications.emit";
import * as notifRepo from "./stakeholder-notifications.repository";

/** Days after which an unaccepted invite or open request may receive one reminder (per rolling window). */
export const STAKEHOLDER_REMINDER_COOLDOWN_DAYS = 7;

function rollingSinceIso(): string {
  return new Date(Date.now() - STAKEHOLDER_REMINDER_COOLDOWN_DAYS * 86400000).toISOString();
}

export async function runStakeholderNotificationReminders(admin: SupabaseClient): Promise<{
  inviteReminders: number;
  requestReminders: number;
}> {
  const sinceIso = rollingSinceIso();
  let inviteReminders = 0;
  let requestReminders = 0;

  const { data: invites } = await admin
    .from("project_stakeholders")
    .select("id, tenant_id, project_id, created_at, expires_at")
    .eq("status", "invited")
    .gt("expires_at", new Date().toISOString())
    .lt("created_at", sinceIso);

  for (const inv of invites ?? []) {
    const tenantId = inv.tenant_id as string;
    const id = inv.id as string;
    if (await notifRepo.hasRecentInviteReminder(admin, tenantId, id, sinceIso)) continue;
    const inviteRow = await shRepo.getById(admin, id, tenantId);
    if (!inviteRow) continue;
    await emitInviteReminderIfConfigured(admin, {
      tenantId,
      projectId: inv.project_id as string,
      inviteRow,
      invitePath: `/dashboard/stakeholder-invite?token=${inviteRow.token}`,
    });
    inviteReminders++;
  }

  const { data: reqs } = await admin
    .from("project_client_requests")
    .select("id, tenant_id, project_id, title, requested_at, action_mode, status")
    .eq("status", "open")
    .neq("action_mode", "info_only")
    .lt("requested_at", sinceIso);

  for (const r of reqs ?? []) {
    const tenantId = r.tenant_id as string;
    const requestId = r.id as string;
    if (await notifRepo.hasRecentReminderForRequest(admin, tenantId, requestId, "client_request_reminder", sinceIso)) {
      continue;
    }
    await emitClientRequestReminderForStakeholders(admin, {
      tenantId,
      projectId: r.project_id as string,
      requestId,
      title: String(r.title ?? "Request"),
    });
    requestReminders++;
  }

  return { inviteReminders, requestReminders };
}
