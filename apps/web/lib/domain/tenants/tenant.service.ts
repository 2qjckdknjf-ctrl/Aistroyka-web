/**
 * Tenant orchestration. Resolve active tenant for user; create if needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./tenant.repository";
import * as invRepo from "./invitation.repository";
import type { Tenant, TenantMember } from "./tenant.types";
import type { TenantInvitation } from "./invitation.repository";
import { emitAudit } from "@/lib/observability/audit.service";
import { getAppUrl } from "@/lib/app-url";

export async function getOrCreateTenantForUser(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const own = await repo.getTenantByUserId(supabase, user.id);
  if (own?.id) return own.id;

  const member = await repo.getFirstMembership(supabase, user.id);
  if (member?.tenant_id) return member.tenant_id;

  const name = user.user_metadata?.name ?? user.email ?? "Personal";
  const created = await repo.createTenant(supabase, { name, user_id: user.id });
  if (created?.id) {
    await repo.addMember(supabase, created.id, user.id, "owner");
    return created.id;
  }

  // Fallback: use repository method if available, otherwise direct call
  const fallback = await repo.getTenantById(supabase, "");
  return null;
}

export async function getTenant(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Tenant | null> {
  return repo.getTenantById(supabase, tenantId);
}

export interface InviteMemberInput {
  email: string;
  role: "admin" | "member" | "viewer";
}

export interface InviteMemberResult {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  accept_link: string;
}

const INVITE_EXPIRES_DAYS = 7;

/**
 * Invite a member to the tenant.
 */
export async function inviteMember(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: InviteMemberInput
): Promise<{ data: InviteMemberResult | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { data: null, error: "Unauthorized" };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { data: null, error: "email is required" };
  }

  const role = ["admin", "member", "viewer"].includes(input.role) ? input.role : "member";

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS);

  // Generate token
  const token = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}-${Math.random()}`;

  const invitation = await invRepo.createInvitation(
    supabase,
    ctx.tenantId,
    email,
    role,
    ctx.userId,
    expiresAt.toISOString(),
    token
  );

  if (!invitation) {
    return { data: null, error: "Failed to create invitation" };
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    action: "invite",
    resource_type: "tenant_invitation",
    resource_id: invitation.id,
    details: { email: invitation.email, role },
  });

  const baseUrl = getAppUrl();
  const acceptLink = `${baseUrl}/invite/accept?token=${invitation.token}`;

  return {
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expires_at,
      accept_link: acceptLink,
    },
    error: "",
  };
}

/**
 * List tenant members.
 */
export async function listMembers(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: Array<{ user_id: string; role: string; created_at: string; is_owner: boolean }>; error: string }> {
  if (!ctx.tenantId) {
    return { data: [], error: "Unauthorized" };
  }

  const tenant = await repo.getTenantById(supabase, ctx.tenantId);
  if (!tenant) {
    return { data: [], error: "Tenant not found" };
  }

  const members = await repo.listMembers(supabase, ctx.tenantId);

  const result = members.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    created_at: m.created_at,
    is_owner: tenant.user_id === m.user_id,
  }));

  return { data: result, error: "" };
}

/**
 * List tenant invitations.
 */
export async function listInvitations(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: TenantInvitation[]; error: string }> {
  if (!ctx.tenantId) {
    return { data: [], error: "Unauthorized" };
  }

  const invitations = await invRepo.listInvitations(supabase, ctx.tenantId);
  return { data: invitations, error: "" };
}

/**
 * Accept tenant invitation.
 */
export async function acceptInvitation(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<{ data: { tenant_id: string; role: string } | null; error: string }> {
  const invitation = await invRepo.getInvitationByToken(supabase, token);
  if (!invitation) {
    return { data: null, error: "Invitation not found or expired" };
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    return { data: null, error: "Invitation expired" };
  }

  // Verify email match if invitation has email
  // Note: This check is done in the route handler where we have access to user email

  // Add member
  await repo.addMember(supabase, invitation.tenant_id, userId, invitation.role);

  // Delete invitation
  await invRepo.deleteInvitation(supabase, invitation.id);

  return {
    data: {
      tenant_id: invitation.tenant_id,
      role: invitation.role,
    },
    error: "",
  };
}

/**
 * Revoke tenant membership.
 */
export async function revokeMembership(
  supabase: SupabaseClient,
  ctx: TenantContext,
  targetUserId: string
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { ok: false, error: "Unauthorized" };
  }

  // Check if user is owner or admin
  const role = await repo.getMemberRole(supabase, ctx.tenantId, ctx.userId);
  if (role !== "owner" && role !== "admin") {
    return { ok: false, error: "Insufficient rights" };
  }

  // Cannot revoke owner
  const tenant = await repo.getTenantById(supabase, ctx.tenantId);
  if (tenant?.user_id === targetUserId) {
    return { ok: false, error: "Cannot revoke tenant owner" };
  }

  // Delete membership
  const ok = await repo.removeMember(supabase, ctx.tenantId, targetUserId);
  if (!ok) {
    return { ok: false, error: "Failed to revoke membership" };
  }

  return { ok: true, error: "" };
}
