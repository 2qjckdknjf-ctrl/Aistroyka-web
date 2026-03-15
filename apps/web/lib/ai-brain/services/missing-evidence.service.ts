/**
 * Missing evidence detection: produces explainable MissingEvidenceInsight from project signals.
 * Uses EvidenceSignal, ReportSignal; no invented data.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissingEvidenceInsight } from "../domain/intelligence-output.types";
import { getEvidenceSignals } from "./evidence-intelligence.service";
import { getStalenessSignals } from "./evidence-staleness.service";
import { getReportSignals } from "./report-intelligence.service";

function nextId(): string {
  return `me-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getMissingEvidenceInsights(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<MissingEvidenceInsight[]> {
  const at = new Date().toISOString();
  const insights: MissingEvidenceInsight[] = [];

  const [evidenceSignals, stalenessSignals, reportSignals] = await Promise.all([
    getEvidenceSignals(supabase, projectId, tenantId),
    getStalenessSignals(supabase, projectId, tenantId),
    getReportSignals(supabase, projectId, tenantId, { sinceDays: 7 }),
  ]);

  const allEvidenceSignals = [...evidenceSignals, ...stalenessSignals];

  for (const es of allEvidenceSignals) {
    if (
      es.type !== "partial" &&
      es.type !== "missing" &&
      es.type !== "before_after_gap" &&
      es.type !== "stale"
    )
      continue;

    const gap = (es.required ?? 0) - (es.actual ?? 0);
    const severity: MissingEvidenceInsight["severity"] =
      es.severity === "high" ? "high" : es.severity === "medium" ? "medium" : "low";
    const confidence: MissingEvidenceInsight["confidence"] =
      es.required != null && es.actual != null ? "high" : "medium";

    const insightType: MissingEvidenceInsight["type"] =
      es.type === "before_after_gap"
        ? "before_after"
        : es.type === "stale"
          ? "stale"
          : "task";

    let recommendedAction = "Request additional photo evidence for this task.";
    if (es.type === "before_after_gap") {
      recommendedAction =
        "Request before/after photos with correct purpose (report_before, report_after) when uploading.";
    } else if (es.type === "stale") {
      recommendedAction = "Request fresh photo evidence for recent project activity.";
    }

    insights.push({
      id: nextId(),
      projectId,
      type: insightType,
      severity,
      title:
        es.type === "before_after_gap"
          ? `Before/after evidence gap: ${es.message}`
          : es.type === "stale"
            ? `Stale evidence: ${es.message}`
            : `Incomplete evidence: ${es.message}`,
      explanation:
        es.type === "before_after_gap"
          ? es.message
          : es.type === "stale"
            ? es.message
            : `Task requires ${es.required ?? "?"} photo(s); ${es.actual ?? 0} provided. Gap: ${gap}.`,
      evidenceReferences: es.taskId ? [{ resourceType: "task", resourceId: es.taskId }] : [],
      confidence,
      contributingFactors:
        es.type === "stale"
          ? ["Evidence older than 14 days", "Project has recent activity"]
          : [`Required: ${es.required ?? "unknown"}`, `Actual: ${es.actual ?? 0}`],
      recommendedAction,
      at,
    });
  }

  const missingReports = reportSignals.filter((r) => r.type === "missing");
  if (missingReports.length >= 1) {
    const daysList = missingReports
      .map((r) => r.message.replace(/^No report submitted for /, ""))
      .filter(Boolean);
    insights.push({
      id: nextId(),
      projectId,
      type: "report",
      severity: missingReports.length >= 3 ? "high" : missingReports.length >= 2 ? "medium" : "low",
      title: `${missingReports.length} day(s) without report`,
      explanation: `Expected daily reports for: ${daysList.slice(0, 5).join(", ")}${daysList.length > 5 ? "…" : ""}.`,
      evidenceReferences: missingReports
        .filter((r) => r.dayId)
        .slice(0, 5)
        .map((r) => ({ resourceType: "worker_day", resourceId: r.dayId! })),
      confidence: "high",
      contributingFactors: [`${missingReports.length} missing report(s) in last 7 days`],
      recommendedAction: "Request report submission for days without coverage.",
      at,
    });
  }

  return insights;
}
