/**
 * Report intelligence: analyzes daily report coverage and discipline.
 * Produces ReportSignal-like data for the brain. Scaffold: uses existing data, no LLM.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportSignal } from "../domain";

export async function getReportSignals(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  options?: { sinceDays?: number }
): Promise<ReportSignal[]> {
  const sinceDays = options?.sinceDays ?? 7;
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const sinceIso = since.toISOString().slice(0, 10);

  const { data: dayRows } = await supabase
    .from("worker_day")
    .select("id, date, user_id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .gte("date", sinceIso);

  const signals: ReportSignal[] = [];
  const at = new Date().toISOString();

  if (!dayRows?.length) {
    signals.push({
      projectId,
      type: "missing",
      severity: "medium",
      message: "No report days in range",
      at,
    });
    return signals;
  }

  const dayIds = (dayRows as { id: string }[]).map((d) => d.id);
  const { data: reportRows } = await supabase
    .from("worker_reports")
    .select("id, day_id, status, submitted_at")
    .eq("tenant_id", tenantId)
    .in("day_id", dayIds);

  const reportsByDay = new Map<string, { id: string; status: string; submitted_at: string | null }[]>();
  for (const r of (reportRows ?? []) as { id: string; day_id: string; status: string; submitted_at: string | null }[]) {
    const list = reportsByDay.get(r.day_id) ?? [];
    list.push(r);
    reportsByDay.set(r.day_id, list);
  }

  for (const day of dayRows as { id: string; date: string }[]) {
    const reports = reportsByDay.get(day.id) ?? [];
    const submitted = reports.filter((r) => r.status === "submitted");
    if (submitted.length === 0) {
      signals.push({
        projectId,
        type: "missing",
        severity: "low",
        dayId: day.id,
        message: `No report submitted for ${day.date}`,
        at,
      });
    } else {
      signals.push({
        reportId: submitted[0].id,
        projectId,
        type: "submitted",
        severity: "low",
        dayId: day.id,
        message: `Report submitted for ${day.date}`,
        at,
      });
    }
  }

  return signals;
}
