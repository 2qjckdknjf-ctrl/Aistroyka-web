/**
 * Owner portal evidence vertical slice — customer-safe overview and visual progress.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadClientPortalView } from "@/lib/domain/stakeholders/stakeholders.policy";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { listOwnerVisibleEvidence } from "@/lib/domain/visual-evidence/visual-evidence.service";
import {
  projectSignedMediaForEvidence,
  assertPortalMediaPayloadSafe,
} from "@/lib/domain/portal/portal-media-projection.service";

export interface OwnerPortalOverview {
  project: { id: string; name: string };
  last_confirmed_report_at: string | null;
  last_update_at: string | null;
  data_freshness: "fresh" | "stale" | "unknown";
  open_issues_count: number;
  pending_owner_decisions: number;
  confirmed_progress_summary: string | null;
  manager_verified_by: string | null;
  ai_generated_sections: string[];
  sources: Array<{ type: string; id: string; label: string }>;
}

export interface OwnerVisualProgressItem {
  id: string;
  zone_label: string | null;
  before_after_kind: "before" | "after" | "unpaired" | null;
  capture_timestamp: string | null;
  report_id: string | null;
  issue_id: string | null;
  manager_verified: boolean;
  signed_image_url: string | null;
  signed_url_expires_in_sec: number | null;
  image_unavailable_reason: string | null;
  ai_generated: boolean;
  ai_confidence: number | null;
  source_label: string;
}

export interface OwnerPortalVisualProgress {
  project: { id: string; name: string };
  items: OwnerVisualProgressItem[];
  stale: boolean;
  last_updated_at: string | null;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

function freshnessFromDate(iso: string | null): "fresh" | "stale" | "unknown" {
  if (!iso) return "unknown";
  const age = Date.now() - new Date(iso).getTime();
  return age <= STALE_MS ? "fresh" : "stale";
}

export async function getOwnerPortalOverview(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: OwnerPortalOverview | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };
  if (!(await canReadClientPortalView(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const { data: taskRows } = await supabase
    .from("worker_tasks")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId);
  const taskIds = (taskRows ?? []).map((t) => (t as { id: string }).id);

  let lastApproved:
    | { id: string; reviewed_at: string | null; reviewed_by: string | null; submitted_at: string | null }
    | undefined;

  if (taskIds.length > 0) {
    const { data: approvedReports } = await supabase
      .from("worker_reports")
      .select("id, reviewed_at, reviewed_by, submitted_at, status")
      .eq("tenant_id", ctx.tenantId)
      .eq("status", "approved")
      .in("task_id", taskIds)
      .order("reviewed_at", { ascending: false })
      .limit(1);
    lastApproved = (approvedReports ?? [])[0] as typeof lastApproved;
  }

  const { count: openDefects } = await supabase
    .from("project_defects")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .in("status", ["open", "in_progress"]);

  const { count: pendingDecisions } = await supabase
    .from("client_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("project_id", projectId)
    .eq("status", "pending");

  const lastUpdate = lastApproved?.reviewed_at ?? lastApproved?.submitted_at ?? null;

  return {
    data: {
      project: { id: project.id, name: project.name },
      last_confirmed_report_at: lastApproved?.reviewed_at ?? null,
      last_update_at: lastUpdate,
      data_freshness: freshnessFromDate(lastUpdate),
      open_issues_count: openDefects ?? 0,
      pending_owner_decisions: pendingDecisions ?? 0,
      confirmed_progress_summary: lastApproved
        ? "Progress confirmed by manager after daily report review."
        : null,
      manager_verified_by: lastApproved?.reviewed_by ?? null,
      ai_generated_sections: [],
      sources: lastApproved
        ? [{ type: "report", id: lastApproved.id, label: "Approved daily report" }]
        : [],
    },
    error: "",
  };
}

export async function getOwnerPortalVisualProgress(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: OwnerPortalVisualProgress | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };
  if (!(await canReadClientPortalView(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const evidence = await listOwnerVisibleEvidence(supabase, ctx.tenantId, projectId);

  const items: OwnerVisualProgressItem[] = [];
  let lastUpdated: string | null = null;

  for (const ev of evidence) {
    const projection = await projectSignedMediaForEvidence(supabase, ctx.tenantId, projectId, ev);

    if (ev.capture_timestamp && (!lastUpdated || ev.capture_timestamp > lastUpdated)) {
      lastUpdated = ev.capture_timestamp;
    }

    items.push({
      id: ev.id,
      zone_label: ev.zone_label,
      before_after_kind: ev.before_after_kind,
      capture_timestamp: ev.capture_timestamp,
      report_id: ev.report_id,
      issue_id: ev.issue_id,
      manager_verified: ev.manager_verified,
      signed_image_url: projection.signed_url,
      signed_url_expires_in_sec: projection.signed_url ? projection.expires_in_sec : null,
      image_unavailable_reason: projection.unavailable_reason,
      ai_generated: ev.ai_analysis_status === "complete",
      ai_confidence: null,
      source_label: ev.report_id ? `Report ${ev.report_id.slice(0, 8)}` : "Visual evidence",
    });
  }

  const payload = {
    project: { id: project.id, name: project.name },
    items,
    stale: freshnessFromDate(lastUpdated) === "stale",
    last_updated_at: lastUpdated,
  };

  if (!assertPortalMediaPayloadSafe(payload)) {
    return { data: null, error: "Portal media payload failed safety guard" };
  }

  return {
    data: payload,
    error: "",
  };
}
