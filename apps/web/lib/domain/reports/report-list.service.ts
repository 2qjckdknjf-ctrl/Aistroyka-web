/**
 * Report list service - handles listing and enrichment of reports.
 * Business logic for report metadata aggregation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadReports } from "./report.policy";
import * as repo from "./report-list.repository";
import * as jobRepo from "@/lib/platform/jobs/job.repository";

export interface ListReportsFilters {
  projectId?: string;
  userId?: string;
  from?: string;
  to?: string;
  limit: number;
  q?: string;
}

export interface EnrichedReport {
  id: string;
  tenant_id: string;
  user_id: string;
  day_id: string | null;
  task_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  media_count: number;
  analysis_status: "none" | "queued" | "running" | "success" | "failed";
}

/**
 * List reports with metadata enrichment (media count, analysis status).
 */
export async function listReportsWithMetadata(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: ListReportsFilters & { statusFilter?: string }
): Promise<{ data: EnrichedReport[]; error: string | null }> {
  if (!canReadReports(ctx)) {
    return { data: [], error: "Insufficient rights" };
  }

  if (!ctx.tenantId) {
    return { data: [], error: "Tenant required" };
  }

  // Get base report list
  let data = await repo.listReportsForManager(supabase, ctx.tenantId, {
    projectId: filters.projectId,
    userId: filters.userId,
    from: filters.from,
    to: filters.to,
    limit: filters.limit,
    q: filters.q,
  });

  // Apply status filter if provided
  if (filters.statusFilter) {
    data = data.filter((r) => r.status === filters.statusFilter);
  }

  const reportIds = data.map((r) => r.id);
  if (reportIds.length === 0) {
    return {
      data: data.map((r) => ({
        ...r,
        media_count: 0,
        analysis_status: "none" as const,
      })),
      error: null,
    };
  }

  // Enrich with metadata
  const enriched = await enrichReportsWithMetadata(supabase, ctx.tenantId, data, reportIds);

  return { data: enriched, error: null };
}

/**
 * Enrich reports with media count and analysis status.
 */
async function enrichReportsWithMetadata(
  supabase: SupabaseClient,
  tenantId: string,
  reports: Awaited<ReturnType<typeof repo.listReportsForManager>>,
  reportIds: string[]
): Promise<EnrichedReport[]> {
  // Fetch media counts and job statuses in parallel
  const [mediaRes, jobsRes] = await Promise.all([
    supabase
      .from("worker_report_media")
      .select("report_id")
      .in("report_id", reportIds),
    supabase
      .from("jobs")
      .select("status, payload")
      .eq("tenant_id", tenantId)
      .or("type.eq.ai_analyze_report,type.eq.ai_analyze_media")
      .limit(1000),
  ]);

  // Calculate media counts
  const mediaCountByReport: Record<string, number> = {};
  for (const r of reports) {
    mediaCountByReport[r.id] = 0;
  }
  for (const row of (mediaRes.data ?? []) as { report_id: string }[]) {
    if (mediaCountByReport[row.report_id] !== undefined) {
      mediaCountByReport[row.report_id]++;
    }
  }

  // Calculate analysis status
  const jobs = (jobsRes.data ?? []) as {
    status: string;
    payload?: { report_id?: string };
  }[];
  const statusByReport: Record<string, "queued" | "running" | "success" | "failed"> = {};
  for (const r of reports) {
    statusByReport[r.id] = "queued";
  }
  for (const j of jobs) {
    const rid = j.payload?.report_id;
    if (!rid || statusByReport[rid] === undefined) continue;
    if (j.status === "running") {
      statusByReport[rid] = "running";
    } else if (j.status === "success" && statusByReport[rid] !== "running") {
      statusByReport[rid] = "success";
    } else if (
      (j.status === "failed" || j.status === "dead") &&
      statusByReport[rid] !== "running" &&
      statusByReport[rid] !== "success"
    ) {
      statusByReport[rid] = "failed";
    }
  }

  // Combine results
  return reports.map((r) => ({
    ...r,
    media_count: mediaCountByReport[r.id] ?? 0,
    analysis_status: statusByReport[r.id] ?? ("none" as const),
  }));
}
