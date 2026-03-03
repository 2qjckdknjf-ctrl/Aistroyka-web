/**
 * PL1 Observability: aggregate telemetry from existing DB (read-only).
 * No new tables or backend architecture.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const RISK_TO_STRATEGIC: Record<string, number> = {
  low: 20,
  medium: 50,
  high: 80,
};

const RISK_TO_CONFIDENCE_PENALTY: Record<string, number> = {
  low: 0,
  medium: 15,
  high: 30,
};

const MAX_SAMPLE_JOBS = 1000;
const MAX_SAMPLE_ANALYSES = 1000;

export interface SystemTelemetry {
  analysis_success_rate: number;
  avg_analysis_duration_seconds: number;
  retry_rate: number;
  avg_confidence: number;
  anomaly_rate: number;
  avg_strategic_risk: number;
  avg_health_score: number;
  /** Counts used for rates (e.g. total jobs, total analyses) */
  _meta: {
    totalJobs: number;
    completedJobs: number;
    totalAnalyses: number;
    jobsWithDuration: number;
  };
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface SystemMetrics {
  telemetry: SystemTelemetry;
  riskDistribution: RiskDistribution;
  usage: { totalJobs: number; totalAnalyses: number; totalMedia: number };
}

/**
 * Fetch analysis_jobs (recent) for success rate, duration, retry proxy.
 */
async function fetchJobsSample(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("analysis_jobs")
    .select("id, media_id, status, started_at, finished_at")
    .order("started_at", { ascending: false })
    .limit(MAX_SAMPLE_JOBS);
  return data ?? [];
}

/**
 * Fetch ai_analysis (recent) for risk distribution, confidence proxy, anomaly rate.
 */
async function fetchAnalysesSample(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("ai_analysis")
    .select("id, risk_level, detected_issues")
    .order("created_at", { ascending: false })
    .limit(MAX_SAMPLE_ANALYSES);
  return data ?? [];
}

/**
 * Aggregate telemetry and risk distribution from existing data.
 */
export async function getSystemMetrics(
  supabase: SupabaseClient
): Promise<SystemMetrics | null> {
  const [jobs, analyses] = await Promise.all([
    fetchJobsSample(supabase),
    fetchAnalysesSample(supabase),
  ]);

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const analysis_success_rate =
    totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  const jobsWithDuration = jobs.filter(
    (j) => j.status === "completed" && j.started_at && j.finished_at
  );
  const durations = jobsWithDuration.map(
    (j) =>
      (new Date(j.finished_at!).getTime() - new Date(j.started_at!).getTime()) /
      1000
  );
  const avg_analysis_duration_seconds =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  const mediaIdCounts = new Map<string, number>();
  for (const j of jobs) {
    const mid = j.media_id;
    mediaIdCounts.set(mid, (mediaIdCounts.get(mid) ?? 0) + 1);
  }
  const reRunJobs = Array.from(mediaIdCounts.values()).filter((c) => c > 1).length;
  const distinctMedia = mediaIdCounts.size;
  const retry_rate =
    totalJobs > 0 ? ((totalJobs - distinctMedia) / totalJobs) * 100 : 0;

  const totalAnalyses = analyses.length;
  if (totalAnalyses === 0) {
    return {
      telemetry: {
        analysis_success_rate,
        avg_analysis_duration_seconds,
        retry_rate,
        avg_confidence: 0,
        anomaly_rate: 0,
        avg_strategic_risk: 0,
        avg_health_score: 100,
        _meta: {
          totalJobs,
          completedJobs,
          totalAnalyses: 0,
          jobsWithDuration: jobsWithDuration.length,
        },
      },
      riskDistribution: { low: 0, medium: 0, high: 0 },
      usage: {
        totalJobs,
        totalAnalyses: 0,
        totalMedia: distinctMedia,
      },
    };
  }

  const riskDistribution: RiskDistribution = { low: 0, medium: 0, high: 0 };
  let confidenceSum = 0;
  let strategicSum = 0;
  let anomalyCount = 0;

  for (const a of analyses) {
    const risk = (a.risk_level ?? "low") as keyof RiskDistribution;
    if (risk in riskDistribution) riskDistribution[risk]++;

    const strategic = RISK_TO_STRATEGIC[risk] ?? 20;
    strategicSum += strategic;

    const issuesCount = Array.isArray(a.detected_issues)
      ? a.detected_issues.length
      : 0;
    const issuesPenalty = Math.min(issuesCount * 5, 40);
    const riskPenalty = RISK_TO_CONFIDENCE_PENALTY[risk] ?? 0;
    const confidence = Math.max(0, 100 - riskPenalty - issuesPenalty);
    confidenceSum += confidence;

    if (risk === "high" || issuesCount > 0) anomalyCount++;
  }

  const avg_confidence = confidenceSum / totalAnalyses;
  const anomaly_rate = (anomalyCount / totalAnalyses) * 100;
  const avg_strategic_risk = strategicSum / totalAnalyses;
  const avg_health_score = Math.max(
    0,
    Math.min(100, 100 - avg_strategic_risk * 0.5)
  );

  const { count: totalMediaCount } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true });

  return {
    telemetry: {
      analysis_success_rate,
      avg_analysis_duration_seconds,
      retry_rate,
      avg_confidence,
      anomaly_rate,
      avg_strategic_risk,
      avg_health_score,
      _meta: {
        totalJobs,
        completedJobs,
        totalAnalyses,
        jobsWithDuration: jobsWithDuration.length,
      },
    },
    riskDistribution,
    usage: {
      totalJobs,
      totalAnalyses,
      totalMedia: totalMediaCount ?? 0,
    },
  };
}
