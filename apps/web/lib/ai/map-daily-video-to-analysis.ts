import type { DailyWorkVideoAnalysis } from "@aistroyka/contracts";
import type { AnalysisResult } from "./types";

/**
 * Map Gemini daily-video structured output into the durable ai_analysis shape.
 * Keeps session complete_session_analysis_job contract without inventing a second result table.
 */
export function mapDailyVideoToAnalysisResult(daily: DailyWorkVideoAnalysis): AnalysisResult {
  const activities = Array.isArray(daily.activities_observed) ? daily.activities_observed : [];
  const issues = Array.isArray(daily.issues_and_risks) ? daily.issues_and_risks : [];
  const materials = Array.isArray(daily.materials_or_equipment_visible)
    ? daily.materials_or_equipment_visible
    : [];
  const visibility =
    typeof daily.visibility_notes === "string" && daily.visibility_notes.trim()
      ? [`visibility: ${daily.visibility_notes.trim()}`]
      : [];

  const detected_issues = [...issues, ...activities.map((a) => `activity: ${a}`), ...materials.map((m) => `material: ${m}`), ...visibility]
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 40);

  const stageBase =
    typeof daily.summary === "string" && daily.summary.trim()
      ? daily.summary.trim().slice(0, 120)
      : "video_daily";

  return {
    stage: stageBase,
    completion_percent: Math.min(100, Math.max(0, Math.round(Number(daily.completion_estimate_percent) || 0))),
    risk_level: daily.risk_level,
    detected_issues,
    recommendations: (Array.isArray(daily.recommendations) ? daily.recommendations : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 40),
  };
}
