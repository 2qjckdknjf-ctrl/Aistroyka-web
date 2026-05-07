/**
 * Property-owner / customer portal (Phase 2).
 * URLs use /portal and /api/v1/portal/* to avoid clashing with platform owner /owner.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as stakeholdersRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import { getClientProjectView } from "@/lib/domain/client-portal/client-portal.service";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { listCustomerEstimates } from "@/lib/domain/customer-estimates/customer-estimates.service";

export type PortalProjectListItem = { id: string; name: string };

/**
 * Projects where the user may open the client portal (portal enabled + stakeholder or project owner membership).
 */
export async function listPortalProjects(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: PortalProjectListItem[]; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: [], error: "Tenant required" };

  const ids = new Set<string>(
    await stakeholdersRepo.listActiveProjectIdsForUser(supabase, ctx.tenantId, ctx.userId)
  );

  const { data: ownerRows, error: memErr } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .eq("role", "owner");
  if (memErr) return { data: [], error: memErr.message };
  for (const r of ownerRows ?? []) {
    const pid = (r as { project_id?: string }).project_id;
    if (pid) ids.add(pid);
  }

  if (ids.size === 0) return { data: [], error: "" };

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("tenant_id", ctx.tenantId)
    .eq("client_portal_enabled", true)
    .in("id", [...ids]);

  if (error) return { data: [], error: error.message };
  return { data: (projects ?? []) as PortalProjectListItem[], error: "" };
}

export async function getPortalProjectView(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ClientProjectView | null; error: string }> {
  return getClientProjectView(supabase, ctx, projectId);
}

export async function getPortalProjectProgress(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{
  data: Pick<ClientProjectView, "project" | "progress" | "milestones"> | null;
  error: string;
}> {
  const r = await getClientProjectView(supabase, ctx, projectId);
  if (!r.data) return { data: null, error: r.error };
  return {
    data: {
      project: r.data.project,
      progress: r.data.progress,
      milestones: r.data.milestones,
    },
    error: "",
  };
}

export async function getPortalProjectDocuments(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{
  data: Pick<ClientProjectView, "project" | "documents"> | null;
  error: string;
}> {
  const r = await getClientProjectView(supabase, ctx, projectId);
  if (!r.data) return { data: null, error: r.error };
  return { data: { project: r.data.project, documents: r.data.documents }, error: "" };
}

export async function getPortalProjectDecisions(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{
  data: Pick<ClientProjectView, "project" | "decisions" | "client_requests" | "capabilities"> | null;
  error: string;
}> {
  const r = await getClientProjectView(supabase, ctx, projectId);
  if (!r.data) return { data: null, error: r.error };
  return {
    data: {
      project: r.data.project,
      decisions: r.data.decisions,
      client_requests: r.data.client_requests,
      capabilities: r.data.capabilities,
    },
    error: "",
  };
}

export async function getPortalProjectEstimates(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<Awaited<ReturnType<typeof listCustomerEstimates>>> {
  return listCustomerEstimates(supabase, ctx, projectId, "customer");
}

export async function getPortalProjectProof(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{
  data: { mode: "share_link"; message: string } | null;
  error: string;
}> {
  const gate = await getClientProjectView(supabase, ctx, projectId);
  if (!gate.data) return { data: null, error: gate.error };
  return {
    data: {
      mode: "share_link",
      message:
        "Before/after proof packs open from a secure link your project team sends you. Ask your manager if you need access.",
    },
    error: "",
  };
}
