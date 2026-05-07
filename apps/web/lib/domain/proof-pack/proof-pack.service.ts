import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects, canReadProjects } from "@/lib/tenant/tenant.policy";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import * as mediaRepo from "@/lib/domain/media/media.repository";
import * as documentRepo from "@/lib/domain/documents/document.repository";
import * as clientRequestRepo from "@/lib/domain/client-requests/client-requests.repository";
import type { Media } from "@/lib/domain/media/media.types";
import type { ProjectProofPack, ProofMediaCategory, ProofPackShare } from "./proof-pack.types";

function mediaCategory(media: Media): ProofMediaCategory {
  const raw = (media.type ?? "").toLowerCase();
  if (raw.includes("before")) return "before";
  if (raw.includes("after")) return "after";
  if (raw.includes("issue")) return "issue";
  if (raw.includes("document")) return "document";
  if (raw.includes("progress") || raw.includes("image") || raw.includes("photo")) return "progress";
  return "other";
}

/** Public token surface: only media that reads as site/customer evidence. */
function includeMediaInPublicProof(m: Media): boolean {
  const t = (m.type ?? "").toLowerCase();
  if (!t.trim()) return false;
  if (/(internal|private|confidential|worker_only|manager_only)/.test(t)) return false;
  return /(before|after|progress|photo|image|evidence|completion|walkthrough|site)/.test(t);
}

export async function buildProjectProofPack(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts?: { audience?: "manager" | "public" }
): Promise<ProjectProofPack | null> {
  const project = await projectRepo.getById(supabase, projectId, tenantId);
  if (!project) return null;

  const [summary, media, documents, requests, commercialRows, changeRows] = await Promise.all([
    getProjectSummary(supabase, projectId, tenantId),
    mediaRepo.listByProject(supabase, projectId, tenantId, { limit: 30 }),
    documentRepo.listByProject(supabase, projectId, tenantId),
    clientRequestRepo.listByProject(supabase, projectId, tenantId, { status: "all" }),
    supabase
      .from("project_commercial_items")
      .select("id, title, amount, currency, status")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .in("status", ["issued", "due", "overdue", "paid"])
      .limit(20),
    supabase
      .from("project_change_orders")
      .select("id, title, customer_amount_delta, currency, status")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .in("status", ["approved", "implemented"])
      .limit(20),
  ]);

  const commercial = ((commercialRows.data ?? []) as Array<{
    id: string;
    title: string;
    amount: number | string;
    currency: string;
    status: string;
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
  }));

  const approvedChanges = ((changeRows.data ?? []) as Array<{
    id: string;
    title: string;
    customer_amount_delta: number | string | null;
    currency: string;
    status: string;
  }>)
    .filter((row) => row.customer_amount_delta != null)
    .map((row) => ({
      id: row.id,
      title: row.title,
      amount: Number(row.customer_amount_delta),
      currency: row.currency,
      status: row.status,
    }));

  const audience = opts?.audience ?? "manager";
  const mediaForPack =
    audience === "public" ? media.filter(includeMediaInPublicProof) : media;

  return {
    generated_at: new Date().toISOString(),
    project: { id: project.id, name: project.name },
    progress: {
      tasks_done: summary.tasksDone,
      tasks_total: summary.tasksTotal,
    },
    media: mediaForPack.map((item) => ({
      id: item.id,
      category: mediaCategory(item),
      file_url: item.file_url,
      uploaded_at: item.uploaded_at ?? null,
    })),
    documents: documents
      .filter((doc) => doc.client_visible && doc.status !== "archived")
      .slice(0, 20)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        status: doc.status,
        updated_at: doc.updated_at,
      })),
    decisions: requests
      .filter((request) => request.status !== "cancelled")
      .slice(0, 20)
      .map((request) => ({
        id: request.id,
        title: request.title,
        status: request.status,
        requested_at: request.requested_at,
      })),
    approved_commercial_changes: [...commercial, ...approvedChanges].slice(0, 30),
  };
}

export async function getManagerProofPack(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectProofPack | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  const pack = await buildProjectProofPack(supabase, ctx.tenantId, projectId, { audience: "manager" });
  return pack ? { data: pack, error: "" } : { data: null, error: "Project not found" };
}

export async function createProofPackShare(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input?: { title?: string | null; expires_at?: string | null }
): Promise<{ data: ProofPackShare | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  const token = crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await supabase
    .from("proof_pack_shares")
    .insert({
      tenant_id: ctx.tenantId,
      project_id: projectId,
      token,
      title: input?.title ?? null,
      expires_at: input?.expires_at ?? null,
      created_by: ctx.userId,
    })
    .select("token, expires_at")
    .single();
  if (error || !data) return { data: null, error: error?.message ?? "Create share failed" };
  return {
    data: {
      token: data.token,
      url: `/share/proof/${data.token}`,
      expires_at: data.expires_at ?? null,
    },
    error: "",
  };
}

/** Call from API with service_role client — anon cannot read proof_pack_shares or pack sources under RLS. */
export async function getProofPackByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ data: ProjectProofPack | null; error: string }> {
  const { data, error } = await supabase
    .from("proof_pack_shares")
    .select("tenant_id, project_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return { data: null, error: "Not found" };
  if (data.revoked_at) return { data: null, error: "Share revoked" };
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { data: null, error: "Share expired" };
  }
  const pack = await buildProjectProofPack(supabase, data.tenant_id, data.project_id, {
    audience: "public",
  });
  return pack ? { data: pack, error: "" } : { data: null, error: "Not found" };
}

export async function revokeProofPackShare(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  token: string
): Promise<{ ok: boolean; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { ok: false, error: "Tenant required" };
  if (!canManageProjects(ctx)) return { ok: false, error: "Insufficient rights" };
  const now = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("proof_pack_shares")
    .update({ revoked_at: now })
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .eq("token", token)
    .is("revoked_at", null)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!rows?.length) return { ok: false, error: "Share not found or already revoked" };
  return { ok: true, error: "" };
}
