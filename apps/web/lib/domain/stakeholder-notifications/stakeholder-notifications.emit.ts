/**
 * Stakeholder-notification emission (Wave 4 Step 8). Uses service-role Supabase client.
 * Best-effort email via Resend when configured.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectStakeholderRow } from "@/lib/domain/stakeholders/stakeholders.types";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import { getAppOriginForLinks, sendTransactionalEmailIfConfigured } from "./stakeholder-notifications.delivery";
import * as notifRepo from "./stakeholder-notifications.repository";

function inviteSubject(projectName: string | undefined): string {
  return projectName ? `Invitation: ${projectName}` : "Invitation to the client portal";
}

function buildInviteBodyForInvitee(params: { invitePath: string; projectName?: string }): string {
  const origin = getAppOriginForLinks();
  const url = `${origin}${params.invitePath}`;
  const pn = params.projectName ? `Project: ${params.projectName}\n\n` : "";
  return `${pn}You've been invited to the client portal.\n\nOpen this link to continue (sign in with this email address): ${url}`;
}

function buildClientRequestBody(params: {
  title: string;
  portalPath: string;
  projectName?: string;
}): string {
  const origin = getAppOriginForLinks();
  const url = `${origin}${params.portalPath}`;
  const pn = params.projectName ? `Project: ${params.projectName}\n\n` : "";
  return `${pn}A new request needs your input: "${params.title}".\n\nOpen the client portal: ${url}`;
}

async function fetchProjectName(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<string | undefined> {
  const { data } = await supabase.from("projects").select("name").eq("id", projectId).eq("tenant_id", tenantId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? undefined;
}

export async function emitStakeholderInviteSent(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    inviteRow: ProjectStakeholderRow;
    invitePath: string;
  }
): Promise<void> {
  const projectName = await fetchProjectName(admin, params.tenantId, params.projectId);
  const email = params.inviteRow.email;
  const kind = "stakeholder_invite_sent" as const;
  const inserted = await notifRepo.insertNotification(admin, {
    tenant_id: params.tenantId,
    project_id: params.projectId,
    recipient_user_id: null,
    recipient_email: email,
    kind,
    status: "pending",
    channel: "both",
    payload: { invite_hint: "Check your email for the invitation link.", project_name: projectName ?? null },
    stakeholder_invite_id: params.inviteRow.id,
    client_request_id: null,
  });
  if (!inserted) return;

  const emailRes = await sendTransactionalEmailIfConfigured({
    to: email,
    subject: inviteSubject(projectName),
    text: buildInviteBodyForInvitee({ invitePath: params.invitePath, projectName }),
  });
  const now = new Date().toISOString();
  await notifRepo.updateNotification(admin, inserted.id, params.tenantId, {
    email_attempted_at: now,
    email_delivered_at: emailRes.ok ? now : null,
    status: emailRes.ok ? "email_sent" : "email_failed",
  });
}

export async function emitClientRequestCreatedForStakeholders(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    requestId: string;
    title: string;
    instructions: string | null;
  }
): Promise<void> {
  const stakeholders = await shRepo.listByProject(admin, params.tenantId, params.projectId);
  const active = stakeholders.filter((s) => s.status === "active" && s.user_id);
  const projectName = await fetchProjectName(admin, params.tenantId, params.projectId);
  const portalPath = `/dashboard/projects/${params.projectId}/client`;

  for (const s of active) {
    if (!s.user_id) continue;
    const row = await notifRepo.insertNotification(admin, {
      tenant_id: params.tenantId,
      project_id: params.projectId,
      recipient_user_id: s.user_id,
      recipient_email: s.email,
      kind: "client_request_new",
      status: "delivered_in_app",
      channel: "both",
      payload: {
        title: params.title,
        instructions: params.instructions,
        project_name: projectName ?? null,
      },
      client_request_id: params.requestId,
    });
    if (!row) continue;

    const emailRes = await sendTransactionalEmailIfConfigured({
      to: s.email,
      subject: projectName ? `Action needed: ${params.title} (${projectName})` : `Action needed: ${params.title}`,
      text: buildClientRequestBody({
        title: params.title,
        portalPath,
        projectName,
      }),
    });
    const now = new Date().toISOString();
    await notifRepo.updateNotification(admin, row.id, params.tenantId, {
      email_attempted_at: now,
      email_delivered_at: emailRes.ok ? now : null,
      status: emailRes.ok ? "email_sent" : "email_failed",
    });
  }
}

export async function emitInviteReminderIfConfigured(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    inviteRow: ProjectStakeholderRow;
    invitePath: string;
  }
): Promise<void> {
  const projectName = await fetchProjectName(admin, params.tenantId, params.projectId);
  const email = params.inviteRow.email;
  const inserted = await notifRepo.insertNotification(admin, {
    tenant_id: params.tenantId,
    project_id: params.projectId,
    recipient_user_id: null,
    recipient_email: email,
    kind: "stakeholder_invite_reminder",
    status: "pending",
    channel: "email",
    payload: { project_name: projectName ?? null },
    stakeholder_invite_id: params.inviteRow.id,
    client_request_id: null,
  });
  if (!inserted) return;

  const emailRes = await sendTransactionalEmailIfConfigured({
    to: email,
    subject: inviteSubject(projectName),
    text: `Reminder — you still have a pending invitation to the client portal.\n\nOpen: ${getAppOriginForLinks()}${params.invitePath}`,
  });
  const now = new Date().toISOString();
  await notifRepo.updateNotification(admin, inserted.id, params.tenantId, {
    email_attempted_at: now,
    email_delivered_at: emailRes.ok ? now : null,
    status: emailRes.ok ? "email_sent" : "email_failed",
  });
}

export async function emitClientRequestReminderForStakeholders(
  admin: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    requestId: string;
    title: string;
  }
): Promise<void> {
  const stakeholders = await shRepo.listByProject(admin, params.tenantId, params.projectId);
  const active = stakeholders.filter((s) => s.status === "active" && s.user_id);
  const projectName = await fetchProjectName(admin, params.tenantId, params.projectId);
  const portalPath = `/dashboard/projects/${params.projectId}/client`;

  for (const s of active) {
    if (!s.user_id) continue;
    const row = await notifRepo.insertNotification(admin, {
      tenant_id: params.tenantId,
      project_id: params.projectId,
      recipient_user_id: s.user_id,
      recipient_email: s.email,
      kind: "client_request_reminder",
      status: "delivered_in_app",
      channel: "both",
      payload: { title: params.title, project_name: projectName ?? null },
      client_request_id: params.requestId,
    });
    if (!row) continue;

    const emailRes = await sendTransactionalEmailIfConfigured({
      to: s.email,
      subject: `Reminder: ${params.title}`,
      text: buildClientRequestBody({ title: params.title, portalPath, projectName }),
    });
    const now = new Date().toISOString();
    await notifRepo.updateNotification(admin, row.id, params.tenantId, {
      email_attempted_at: now,
      email_delivered_at: emailRes.ok ? now : null,
      status: emailRes.ok ? "email_sent" : "email_failed",
    });
  }
}
