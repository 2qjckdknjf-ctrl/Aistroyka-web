/**
 * Visual evidence metadata service — structured project record for photos.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type VisualEvidenceSourceKind =
  | "photo"
  | "video"
  | "panorama_360"
  | "drone"
  | "sensor"
  | "equipment"
  | "robot";

export type BeforeAfterKind = "before" | "after" | "unpaired";

export interface VisualEvidenceRecord {
  id: string;
  tenant_id: string;
  project_id: string;
  report_id: string | null;
  task_id: string | null;
  media_id: string | null;
  upload_session_id: string | null;
  zone_label: string | null;
  source_kind: VisualEvidenceSourceKind;
  before_after_kind: BeforeAfterKind | null;
  pair_group_id: string | null;
  issue_id: string | null;
  capture_timestamp: string | null;
  uploader_user_id: string | null;
  device_source: string | null;
  owner_visible: boolean;
  manager_verified: boolean;
  ai_analysis_status: string;
  provenance: Record<string, unknown>;
  checksum: string | null;
}

export interface UpsertVisualEvidenceInput {
  tenantId: string;
  projectId: string;
  reportId?: string | null;
  taskId?: string | null;
  mediaId?: string | null;
  uploadSessionId?: string | null;
  zoneLabel?: string | null;
  sourceKind?: VisualEvidenceSourceKind;
  beforeAfterKind?: BeforeAfterKind | null;
  pairGroupId?: string | null;
  captureTimestamp?: string | null;
  uploaderUserId?: string | null;
  deviceSource?: string | null;
  ownerVisible?: boolean;
  managerVerified?: boolean;
  provenance?: Record<string, unknown>;
  checksum?: string | null;
}

export async function upsertVisualEvidence(
  supabase: SupabaseClient,
  input: UpsertVisualEvidenceInput
): Promise<VisualEvidenceRecord | null> {
  if (!input.mediaId && !input.uploadSessionId) return null;

  const row = {
    tenant_id: input.tenantId,
    project_id: input.projectId,
    report_id: input.reportId ?? null,
    task_id: input.taskId ?? null,
    media_id: input.mediaId ?? null,
    upload_session_id: input.uploadSessionId ?? null,
    zone_label: input.zoneLabel ?? null,
    source_kind: input.sourceKind ?? "photo",
    before_after_kind: input.beforeAfterKind ?? null,
    pair_group_id: input.pairGroupId ?? null,
    capture_timestamp: input.captureTimestamp ?? null,
    uploader_user_id: input.uploaderUserId ?? null,
    device_source: input.deviceSource ?? null,
    owner_visible: input.ownerVisible ?? false,
    manager_verified: input.managerVerified ?? false,
    provenance: input.provenance ?? {},
    checksum: input.checksum ?? null,
    updated_at: new Date().toISOString(),
  };

  let existingId: string | null = null;
  if (input.mediaId) {
    const { data: existing } = await supabase
      .from("visual_evidence_records")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("media_id", input.mediaId)
      .maybeSingle();
    existingId = (existing as { id?: string } | null)?.id ?? null;
  } else if (input.uploadSessionId) {
    const { data: existing } = await supabase
      .from("visual_evidence_records")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("upload_session_id", input.uploadSessionId)
      .maybeSingle();
    existingId = (existing as { id?: string } | null)?.id ?? null;
  }

  if (existingId) {
    const { data, error } = await supabase
      .from("visual_evidence_records")
      .update(row)
      .eq("id", existingId)
      .select("*")
      .single();
    if (error || !data) return null;
    return data as VisualEvidenceRecord;
  }

  const { data, error } = await supabase.from("visual_evidence_records").insert(row).select("*").single();

  if (error || !data) return null;
  return data as VisualEvidenceRecord;
}

export async function listOwnerVisibleEvidence(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<VisualEvidenceRecord[]> {
  const { data, error } = await supabase
    .from("visual_evidence_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("owner_visible", true)
    .order("capture_timestamp", { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as VisualEvidenceRecord[];
}

export async function syncEvidenceFromReportMedia(
  supabase: SupabaseClient,
  tenantId: string,
  reportId: string,
  projectId: string,
  taskId: string | null,
  uploaderUserId: string
): Promise<number> {
  const { data: mediaRows } = await supabase
    .from("worker_report_media")
    .select("media_id, upload_session_id")
    .eq("report_id", reportId);
  if (!mediaRows?.length) return 0;

  const sessionIds = mediaRows
    .map((r) => (r as { upload_session_id?: string }).upload_session_id)
    .filter(Boolean) as string[];

  const purposeBySession = new Map<string, string>();
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("upload_sessions")
      .select("id, purpose")
      .in("id", sessionIds);
    for (const s of (sessions ?? []) as { id: string; purpose: string }[]) {
      purposeBySession.set(s.id, s.purpose);
    }
  }

  let synced = 0;
  for (const row of mediaRows as { media_id: string | null; upload_session_id: string | null }[]) {
    let beforeAfter: BeforeAfterKind | null = "unpaired";
    if (row.upload_session_id) {
      const purpose = purposeBySession.get(row.upload_session_id);
      if (purpose === "report_before") beforeAfter = "before";
      else if (purpose === "report_after") beforeAfter = "after";
    }

    const pairGroupId = beforeAfter === "before" || beforeAfter === "after" ? reportId : null;

    const record = await upsertVisualEvidence(supabase, {
      tenantId,
      projectId,
      reportId,
      taskId,
      mediaId: row.media_id ?? undefined,
      uploadSessionId: row.upload_session_id ?? undefined,
      beforeAfterKind: beforeAfter,
      pairGroupId,
      uploaderUserId,
      ownerVisible: false,
      managerVerified: false,
      sourceKind: "photo",
      provenance: { synced_from: "worker_report_media" },
    });
    if (record) synced++;
  }
  return synced;
}
