import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./stakeholders.repository";
import { canManageProjectStakeholders } from "./stakeholders.policy";
import type {
  InviteStakeholderInput,
  ProjectStakeholderListItem,
  ProjectStakeholderRow,
  StakeholderRole,
} from "./stakeholders.types";

const ROLES: StakeholderRole[] = ["client_viewer", "client_decision_maker"];

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function rowToListItem(r: ProjectStakeholderRow): ProjectStakeholderListItem {
  return {
    id: r.id,
    email: r.email,
    stakeholder_role: r.stakeholder_role,
    status: r.status,
    expires_at: r.expires_at,
    accepted_at: r.accepted_at,
    created_at: r.created_at,
  };
}

export async function inviteStakeholder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: InviteStakeholderInput
): Promise<{
  data: { id: string; token: string; expires_at: string; invite_path: string } | null;
  error: string;
}> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageProjectStakeholders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const email = repo.normalizeEmail(input.email);
  if (!email.includes("@")) return { data: null, error: "Valid email required" };
  if (!input.stakeholder_role || !ROLES.includes(input.stakeholder_role)) {
    return { data: null, error: "Invalid stakeholder role" };
  }

  const expires = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const row = await repo.insertInvite(supabase, {
    tenant_id: ctx.tenantId,
    project_id: projectId,
    email,
    stakeholder_role: input.stakeholder_role,
    invited_by: ctx.userId,
    expires_at: expires,
  });
  if (!row) return { data: null, error: "Invite failed (duplicate email or invalid project)" };

  const invite_path = `/dashboard/stakeholder-invite?token=${row.token}`;
  return {
    data: { id: row.id, token: row.token, expires_at: row.expires_at, invite_path },
    error: "",
  };
}

export async function listStakeholders(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectStakeholderListItem[] | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageProjectStakeholders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const rows = await repo.listByProject(supabase, ctx.tenantId, projectId);
  return { data: rows.map(rowToListItem), error: "" };
}

export async function revokeStakeholder(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  stakeholderId: string
): Promise<{ data: ProjectStakeholderListItem | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageProjectStakeholders(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  const rows = await repo.listByProject(supabase, ctx.tenantId, projectId);
  const hit = rows.find((r) => r.id === stakeholderId);
  if (!hit) return { data: null, error: "Not found" };
  const updated = await repo.updateRow(supabase, stakeholderId, ctx.tenantId, { status: "revoked" });
  if (!updated) return { data: null, error: "Revoke failed" };
  return { data: rowToListItem(updated), error: "" };
}

/**
 * Accept invite: ensures tenant_members(stakeholder) and activates stakeholder row.
 * Caller must be authenticated; tenant context may be absent until after upsert.
 */
export async function acceptStakeholderInvite(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  token: string
): Promise<{ data: { project_id: string; tenant_id: string; stakeholder_role: StakeholderRole } | null; error: string }> {
  const row = await repo.getByToken(supabase, token);
  if (!row) return { data: null, error: "Invitation not found" };
  if (row.status !== "invited") return { data: null, error: "Invitation is no longer valid" };
  if (new Date(row.expires_at) < new Date()) return { data: null, error: "Invitation expired" };

  const inviteEmail = repo.normalizeEmail(row.email);
  const u = repo.normalizeEmail(userEmail ?? "");
  if (!u || u !== inviteEmail) {
    return { data: null, error: "Sign in with the email address this invitation was sent to." };
  }

  const { data: tenantRow } = await supabase.from("tenants").select("user_id").eq("id", row.tenant_id).maybeSingle();
  const isTenantOwner = tenantRow?.user_id === userId;
  if (!isTenantOwner) {
    const { data: existingTm } = await supabase
      .from("tenant_members")
      .select("id, role")
      .eq("tenant_id", row.tenant_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existingTm) {
      const { error: tmError } = await supabase.from("tenant_members").insert({
        tenant_id: row.tenant_id,
        user_id: userId,
        role: "stakeholder",
      });
      if (tmError) return { data: null, error: "Unable to join workspace for this project" };
    } else if (existingTm.role === "viewer") {
      const { error: upErr } = await supabase
        .from("tenant_members")
        .update({ role: "stakeholder" })
        .eq("id", existingTm.id)
        .eq("tenant_id", row.tenant_id);
      if (upErr) return { data: null, error: "Unable to update workspace role for portal access" };
    }
  }

  const updated = await repo.updateRow(supabase, row.id, row.tenant_id, {
    status: "active",
    user_id: userId,
    accepted_at: new Date().toISOString(),
  });
  if (!updated) return { data: null, error: "Activation failed" };

  return {
    data: {
      project_id: row.project_id,
      tenant_id: row.tenant_id,
      stakeholder_role: row.stakeholder_role,
    },
    error: "",
  };
}
