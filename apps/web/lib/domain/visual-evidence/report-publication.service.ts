import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveAIMediaImage } from "@/lib/platform/ai/resolve-ai-media-image";

export class ReportPublicationError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
type Report = { id: string; tenant_id: string; user_id: string; task_id: string | null; day_id: string | null; status: string };
type Link = { id: string; report_id: string; media_id: string | null; upload_session_id: string | null };
type Evidence = {
  id: string; tenant_id: string; project_id: string; report_id: string; task_id: string | null;
  media_id: string | null; upload_session_id: string | null; uploader_user_id: string;
  owner_visible: boolean; manager_verified: boolean; internal_only: boolean; retention_state: string;
  source_kind: string; updated_at: string;
};
const COLUMNS = "id,tenant_id,project_id,report_id,task_id,media_id,upload_session_id,uploader_user_id,owner_visible,manager_verified,internal_only,retention_state,source_kind,updated_at";
function fail(status: number, message: string): never { throw new ReportPublicationError(status, message); }
function unavailable(): never { return fail(503, "Report publication temporarily unavailable"); }

async function scope(client: SupabaseClient, ctx: TenantContext, reportId: string) {
  if (ctx.role === "stakeholder" || ctx.role === "viewer" || ctx.clientProfile === "ios_customer"
      || ctx.clientProfile === "ios_worker" || ctx.clientProfile === "android_worker"
      || isLiteWorkerClient(ctx) || !canReviewReport(ctx)) fail(403, "Insufficient publication rights");
  const result = await client.from("worker_reports").select("id,tenant_id,user_id,task_id,day_id,status")
    .eq("id", reportId).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (result.error) unavailable();
  const report = result.data as Report | null;
  if (!report) fail(404, "Report not available");
  let projectId: string | null = null;
  if (report.task_id) {
    const task = await client.from("worker_tasks").select("project_id")
      .eq("id", report.task_id).eq("tenant_id", ctx.tenantId).maybeSingle();
    if (task.error) unavailable();
    if (!task.data?.project_id) fail(409, "Report source is unavailable");
    projectId = task.data.project_id;
  }
  if (report.day_id) {
    // Legacy day schemas can lack project_id; selecting the row preserves that distinction.
    const day = await client.from("worker_day").select("*")
      .eq("id", report.day_id).eq("tenant_id", ctx.tenantId).maybeSingle();
    if (day.error) unavailable();
    if (!day.data) fail(409, "Report source is unavailable");
    const dayProject = typeof day.data.project_id === "string" ? day.data.project_id : null;
    if (projectId && dayProject && projectId !== dayProject) fail(409, "Conflicting report projects");
    projectId = projectId ?? dayProject;
  }
  if (!projectId) fail(409, "Report has no project source");
  const permission = await client.rpc("can_manage_project_membership", { p_tenant_id: ctx.tenantId, p_project_id: projectId });
  if (permission.error) unavailable();
  if (permission.data !== true) fail(403, "Insufficient publication rights");
  const project = await client.from("projects").select("id,client_portal_enabled")
    .eq("id", projectId).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (project.error) unavailable();
  if (!project.data) fail(404, "Project not available");
  // Only account metadata uses the server client. Source reads and publication writes use requester RLS.
  const admin: SupabaseClient | null = getAdminClient();
  if (!admin) unavailable();
  const tenant = await admin.from("tenants").select("account_id").eq("id", ctx.tenantId).maybeSingle();
  if (tenant.error) unavailable();
  if (!tenant.data?.account_id) fail(403, "Account unavailable");
  const account = await admin.from("accounts").select("status").eq("id", tenant.data.account_id).maybeSingle();
  if (account.error) unavailable();
  if (account.data?.status !== "active") fail(403, "Account unavailable");
  return { report, projectId, portalEnabled: project.data.client_portal_enabled === true };
}

function matches(row: Evidence, link: Link, report: Report, projectId: string) {
  return row.tenant_id === report.tenant_id && row.project_id === projectId && row.report_id === report.id
    && row.task_id === report.task_id && row.uploader_user_id === report.user_id
    && row.media_id === link.media_id && row.upload_session_id === link.upload_session_id;
}
function forLink(rows: Evidence[], link: Link, report: Report, projectId: string) {
  const candidates = rows.filter(row => (link.media_id && row.media_id === link.media_id)
    || (link.upload_session_id && row.upload_session_id === link.upload_session_id));
  if (candidates.length > 1 || (candidates[0] && !matches(candidates[0], link, report, projectId)))
    fail(409, "Evidence identity requires reconciliation");
  return candidates[0] ?? null;
}
function projection(link: Link, row: Evidence | null, sharingAvailable = true) {
  const published = row?.owner_visible === true && row.manager_verified === true && !row.internal_only && row.retention_state === "active";
  return { attachment_id: link.id, media_id: link.media_id, upload_session_id: link.upload_session_id,
    published, sharing_enabled: published && sharingAvailable,
    evidence_id: row?.id ?? null, version: row?.updated_at ?? null,
    eligible: !row || (!row.internal_only && row.retention_state === "active" && row.source_kind === "photo") };
}
async function sources(client: SupabaseClient, ctx: TenantContext, report: Report) {
  const links = await client.from("worker_report_media").select("id,report_id,media_id,upload_session_id")
    .eq("report_id", report.id).order("id").limit(101);
  if (links.error) unavailable();
  if ((links.data?.length ?? 0) > 100) fail(409, "Report publication requires a smaller attachment batch");
  const rows = (links.data ?? []) as Link[];
  const mediaIds = [...new Set(rows.flatMap(row => row.media_id ? [row.media_id] : []))];
  const uploadIds = [...new Set(rows.flatMap(row => row.upload_session_id ? [row.upload_session_id] : []))];
  const query = () => client.from("visual_evidence_records").select(COLUMNS).eq("tenant_id", ctx.tenantId);
  // Include retained records for these exact sources, even if their historic report binding differs.
  // Conflicts require reconciliation; silently creating a second record would duplicate old work.
  const results = await Promise.all([
    query().eq("report_id", report.id).limit(101),
    mediaIds.length ? query().in("media_id", mediaIds).limit(101) : Promise.resolve({ data: [], error: null }),
    uploadIds.length ? query().in("upload_session_id", uploadIds).limit(101) : Promise.resolve({ data: [], error: null }),
  ]);
  if (results.some(result => result.error)) unavailable();
  const evidence = [...new Map(results.flatMap(result => (result.data ?? []) as Evidence[]).map(row => [row.id, row])).values()];
  if (evidence.length > 100) fail(409, "Report publication requires a smaller attachment batch");
  return { links: rows, evidence };
}
export async function listReportPublication(client: SupabaseClient, ctx: TenantContext, reportId: string) {
  const { report, projectId, portalEnabled } = await scope(client, ctx, reportId);
  const { links, evidence } = await sources(client, ctx, report);
  const mediaIds = [...new Set(links.flatMap(row => row.media_id ? [row.media_id] : []))];
  const uploadIds = [...new Set(links.flatMap(row => row.upload_session_id ? [row.upload_session_id] : []))];
  const [media, uploads] = await Promise.all([
    mediaIds.length ? client.from("media").select("id,type").eq("tenant_id", ctx.tenantId).eq("project_id", projectId).in("id", mediaIds) : Promise.resolve({ data: [], error: null }),
    uploadIds.length ? client.from("upload_sessions").select("id,status,mime_type").eq("tenant_id", ctx.tenantId).in("id", uploadIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (media.error || uploads.error) unavailable();
  const photos = new Set((media.data ?? []).filter(row => row.type === "image").map(row => row.id));
  const imageUploads = new Set((uploads.data ?? []).filter(row => row.status === "finalized"
    && ["image/jpeg", "image/png", "image/webp"].includes(row.mime_type)).map(row => row.id));
  return { report_id: report.id, project_id: projectId, report_status: report.status, portal_enabled: portalEnabled,
    items: links.map(link => {
      const item = projection(link, forLink(evidence, link, report, projectId), portalEnabled && report.status === "approved");
      const eligible = item.eligible && Boolean(link.media_id || link.upload_session_id)
        && (!link.media_id || photos.has(link.media_id)) && (!link.upload_session_id || imageUploads.has(link.upload_session_id));
      return { ...item, eligible, sharing_enabled: item.sharing_enabled && eligible };
    }) };
}

export async function setReportPublication(client: SupabaseClient, ctx: TenantContext, reportId: string,
  input: { attachmentId: string; visible: boolean; expectedVersion: string | null }) {
  const { report, projectId, portalEnabled } = await scope(client, ctx, reportId);
  if (input.visible && (report.status !== "approved" || !portalEnabled)) fail(409, "Approve the report and enable the customer portal before publication");
  if (input.visible) {
    const ready = await client.rpc("published_evidence_source_guard_ready");
    if (ready.error || ready.data !== true) unavailable();
  }
  const { links, evidence } = await sources(client, ctx, report);
  const link = links.find(item => item.id === input.attachmentId);
  if (!link || (!link.media_id && !link.upload_session_id)) fail(404, "Attachment not available");
  const existing = forLink(evidence, link, report, projectId);
  if ((existing?.updated_at ?? null) !== input.expectedVersion) fail(409, "Publication changed; refresh before trying again");
  if (input.visible) {
    if (existing && (existing.internal_only || existing.retention_state !== "active" || existing.source_kind !== "photo"))
      fail(409, "Evidence is not eligible for publication");
    if (link.media_id) {
      const media = await client.from("media").select("type").eq("id", link.media_id)
        .eq("tenant_id", ctx.tenantId).eq("project_id", projectId).maybeSingle();
      if (media.error) unavailable();
      if (media.data?.type !== "image") fail(409, "Only project photos can be published here");
    }
    if (link.upload_session_id) {
      const upload = await client.from("upload_sessions").select("status,mime_type")
        .eq("id", link.upload_session_id).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (upload.error) unavailable();
      if (upload.data?.status !== "finalized" || !["image/jpeg", "image/png", "image/webp"].includes(upload.data?.mime_type ?? ""))
        fail(409, "Only finalized project photos can be published here");
    }
    const resolved = await resolveAIMediaImage(client, { tenantId: ctx.tenantId, projectIdClaim: projectId,
      reportId, mediaId: link.media_id, uploadSessionId: link.upload_session_id });
    if (!resolved.ok) fail(resolved.retryable ? 503 : 409, "Attachment source is unavailable");
    if (resolved.trustedProjectId !== projectId) fail(409, "Attachment project mismatch");
  }
  if (!existing && !input.visible) return projection(link, null);
  const changedAt = new Date(Math.max(Date.now(), existing ? Date.parse(existing.updated_at) + 1 : 0)).toISOString();
  let result;
  if (existing) {
    result = await client.from("visual_evidence_records")
      .update({ owner_visible: input.visible, manager_verified: input.visible, updated_at: changedAt })
      .eq("id", existing.id).eq("tenant_id", ctx.tenantId).eq("report_id", reportId)
      .eq("updated_at", input.expectedVersion!).select(COLUMNS).maybeSingle();
  } else {
    // Stable attachment UUID gives concurrent creation a unique PK, without rewriting retained records.
    result = await client.from("visual_evidence_records").insert({ id: link.id, tenant_id: ctx.tenantId,
      project_id: projectId, report_id: reportId, task_id: report.task_id, media_id: link.media_id,
      upload_session_id: link.upload_session_id, uploader_user_id: report.user_id, source_kind: "photo",
      internal_only: false, owner_visible: true, manager_verified: true, retention_state: "active", updated_at: changedAt })
      .select(COLUMNS).maybeSingle();
  }
  if (result.error) {
    if (["23505", "23514", "42501"].includes(result.error.code)) fail(409, "Publication changed or is no longer allowed; refresh before trying again");
    unavailable();
  }
  const updated = result.data as Evidence | null;
  if (!updated || !matches(updated, link, report, projectId) || updated.owner_visible !== input.visible
      || updated.manager_verified !== input.visible) fail(409, "Publication changed; refresh before trying again");
  return projection(link, updated);
}
