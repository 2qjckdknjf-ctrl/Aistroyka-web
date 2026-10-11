/** Published-only recovery of #244. Raw records and Storage URLs stay server-side. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveAIMediaImage } from "@/lib/platform/ai/resolve-ai-media-image";
import { MEDIA_BUCKET } from "@/lib/platform/ai/media-bucket.constants";
import { assertCustomerFinanceSafePayload } from "@/lib/security/customer-finance-guard";

export class PublishedEvidenceError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type EvidenceSource = {
  id: string; tenant_id: string; project_id: string; report_id: string | null;
  task_id: string | null; media_id: string | null; upload_session_id: string | null;
  uploader_user_id: string | null; zone_label: string | null; before_after_kind: string | null;
  capture_timestamp: string | null; source_kind: string; updated_at: string;
  owner_visible: boolean; manager_verified: boolean; internal_only: boolean; retention_state: string;
};
type SourceReport = { id: string; tenant_id: string; user_id: string; status: string; task_id: string | null; day_id: string | null };
type SourceLink = { report_id: string; media_id: string | null; upload_session_id: string | null };
type ScopedSource = { id: string; tenant_id: string; project_id: string };
type SourceUpload = { id: string; tenant_id: string; status: string };
type SourceDay = { id: string; tenant_id: string; project_id?: string | null };
const COLUMNS = "id,tenant_id,project_id,report_id,task_id,media_id,upload_session_id,uploader_user_id,zone_label,before_after_kind,capture_timestamp,source_kind,updated_at,owner_visible,manager_verified,internal_only,retention_state";

export type PublishedEvidenceItem = {
  id: string; zone_label: string | null; before_after_kind: string | null;
  capture_timestamp: string | null; source_kind: string; updated_at: string;
  manager_verified: true; original_url: string;
};

async function authorize(client: SupabaseClient, ctx: TenantContext, projectId: string) {
  if (!ctx.tenantId || !ctx.userId) throw new PublishedEvidenceError(401, "Authentication required");
  if (!(await canReadClientPortalView(client, ctx, projectId))) {
    throw new PublishedEvidenceError(404, "Published evidence not available");
  }
  const admin = getAdminClient();
  if (!admin) throw new PublishedEvidenceError(503, "Published evidence temporarily unavailable");
  return admin;
}

async function readSources(admin: SupabaseClient, ctx: TenantContext, projectId: string, evidenceId?: string) {
  let query = admin.from("visual_evidence_records").select(COLUMNS)
    .eq("tenant_id", ctx.tenantId).eq("project_id", projectId)
    .eq("owner_visible", true).eq("manager_verified", true)
    .eq("internal_only", false).eq("retention_state", "active");
  if (evidenceId) query = query.eq("id", evidenceId);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(50);
  if (error) throw new PublishedEvidenceError(503, "Published evidence temporarily unavailable");
  const rows = ((data ?? []) as EvidenceSource[]).filter(row =>
    row.tenant_id === ctx.tenantId && row.project_id === projectId && row.owner_visible
    && row.manager_verified && !row.internal_only && row.retention_state === "active");
  const reportIds = [...new Set(rows.flatMap(row => row.report_id ? [row.report_id] : []))];
  const mediaIds = [...new Set(rows.flatMap(row => row.media_id ? [row.media_id] : []))];
  const uploadIds = [...new Set(rows.flatMap(row => row.upload_session_id ? [row.upload_session_id] : []))];
  async function load<T>(table: string, columns: string, key: string, ids: string[], tenantScoped = true): Promise<T[]> {
    if (!ids.length) return [];
    let query = admin.from(table).select(columns).in(key, ids);
    if (tenantScoped) query = query.eq("tenant_id", ctx.tenantId);
    const result = await query.returns<T[]>();
    if (result.error) throw new PublishedEvidenceError(503, "Published evidence temporarily unavailable");
    return result.data ?? [];
  }
  const [reports, links, media, uploads] = await Promise.all([
    load<SourceReport>("worker_reports", "id,tenant_id,user_id,status,task_id,day_id", "id", reportIds),
    load<SourceLink>("worker_report_media", "report_id,media_id,upload_session_id", "report_id", reportIds, false),
    load<ScopedSource>("media", "id,tenant_id,project_id", "id", mediaIds),
    load<SourceUpload>("upload_sessions", "id,tenant_id,status", "id", uploadIds),
  ]);
  const taskIds = [...new Set(reports.flatMap(report => report.task_id ? [report.task_id as string] : []))];
  const dayIds = [...new Set(reports.flatMap(report => !report.task_id && report.day_id ? [report.day_id] : []))];
  const [tasks, days] = await Promise.all([
    load<ScopedSource>("worker_tasks", "id,tenant_id,project_id", "id", taskIds),
    // Legacy live worker_day can lack project_id. Read only referenced same-tenant
    // rows and inspect the optional field; keep DB failures explicit, never empty-success.
    load<SourceDay>("worker_day", "*", "id", dayIds),
  ]);
  const sources: EvidenceSource[] = [];
  for (const row of rows) {
    if (!row.media_id && !row.upload_session_id) continue;
    if (row.media_id && !media.some(m => m.id === row.media_id && m.tenant_id === ctx.tenantId && m.project_id === projectId)) continue;
    if (row.upload_session_id && !uploads.some(u => u.id === row.upload_session_id && u.tenant_id === ctx.tenantId && u.status === "finalized")) continue;
    if (row.report_id) {
      const report = reports.find(r => r.id === row.report_id && r.tenant_id === ctx.tenantId);
      if (!report || report.status !== "approved" || report.user_id !== row.uploader_user_id
        || (row.task_id && row.task_id !== report.task_id)) continue;
      const reportProject = report.task_id
        ? tasks.find(t => t.id === report.task_id && t.tenant_id === ctx.tenantId)?.project_id
        : days.find(day => day.id === report.day_id && day.tenant_id === ctx.tenantId)?.project_id;
      if (reportProject !== projectId || !links.some(link => link.report_id === row.report_id
        && (!row.media_id || link.media_id === row.media_id)
        && (!row.upload_session_id || link.upload_session_id === row.upload_session_id))) continue;
    } else if (!row.media_id) continue; // Upload-only sources need report-derived project proof.
    sources.push(row);
  }
  return sources;
}

export async function listPublishedEvidence(client: SupabaseClient, ctx: TenantContext, projectId: string) {
  const admin = await authorize(client, ctx, projectId);
  const rows = await readSources(admin, ctx, projectId);
  const items: PublishedEvidenceItem[] = rows.map(row => ({
    id: row.id, zone_label: row.zone_label, before_after_kind: row.before_after_kind,
    capture_timestamp: row.capture_timestamp, source_kind: row.source_kind, updated_at: row.updated_at,
    manager_verified: true,
    original_url: `/api/v1/portal/projects/${encodeURIComponent(projectId)}/evidence/${encodeURIComponent(row.id)}/original`,
  }));
  const result = { project: { id: projectId }, items };
  if (!assertCustomerFinanceSafePayload(result).ok) throw new PublishedEvidenceError(500, "Unsafe evidence projection");
  // Catch grant/account revocation during the read, before returning a projection.
  await authorize(client, ctx, projectId);
  return result;
}

export async function downloadPublishedEvidence(client: SupabaseClient, ctx: TenantContext, projectId: string, evidenceId: string) {
  const admin = await authorize(client, ctx, projectId);
  const [row] = await readSources(admin, ctx, projectId, evidenceId);
  if (!row) throw new PublishedEvidenceError(404, "Published evidence not available");
  const resolved = await resolveAIMediaImage(admin, {
    tenantId: ctx.tenantId, projectIdClaim: projectId, reportId: row.report_id,
    mediaId: row.media_id, uploadSessionId: row.upload_session_id,
  });
  if (!resolved.ok) throw new PublishedEvidenceError(resolved.retryable ? 503 : 404,
    resolved.retryable ? "Original temporarily unavailable" : "Original not available");
  if (resolved.trustedProjectId !== projectId) throw new PublishedEvidenceError(404, "Original not available");
  const { data: blob, error } = await admin.storage.from(MEDIA_BUCKET).download(resolved.objectPath);
  if (error || !blob) throw new PublishedEvidenceError(503, "Original temporarily unavailable");
  // Check again after Storage I/O: do not return bytes if access/publication was withdrawn.
  await authorize(client, ctx, projectId);
  const [current] = await readSources(admin, ctx, projectId, evidenceId);
  if (!current || current.updated_at !== row.updated_at || current.media_id !== row.media_id
    || current.upload_session_id !== row.upload_session_id) throw new PublishedEvidenceError(404, "Original not available");
  if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type) || blob.size > 20 * 1024 * 1024) {
    throw new PublishedEvidenceError(415, "Original image format not supported");
  }
  await authorize(client, ctx, projectId);
  return blob;
}
