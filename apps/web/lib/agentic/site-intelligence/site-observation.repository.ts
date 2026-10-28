import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalysisResult } from "@aistroyka/contracts";
import { AgentError } from "../errors";
import { toAgentEvidence } from "../contracts/evidence.types";
import { normalizeImageSiteObservation, type SiteObservation } from "./site-observation";

const MAX_MEDIA_SCAN = 100;
const MAX_OBSERVATIONS = 30;
const ANALYSIS_QUERY_BATCH = 10;
const ANALYSIS_SELECT =
  "id, media_id, job_id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at";

export interface PersistedSiteObservation {
  analysisId: string;
  jobId: string | null;
  analysisCreatedAt: string;
  observation: SiteObservation;
}

interface MediaRow {
  id: string;
  uploaded_at: string | null;
}

interface AnalysisRow {
  id: string;
  media_id: string;
  job_id: string | null;
  stage: string | null;
  completion_percent: number | null;
  risk_level: string | null;
  detected_issues: string[] | null;
  recommendations: string[] | null;
  created_at: string;
}

export async function listPersistedImageSiteObservations(
  supabase: SupabaseClient,
  input: { tenantId: string; projectId: string; limit?: number }
): Promise<PersistedSiteObservation[]> {
  const limit = Math.max(1, Math.min(MAX_OBSERVATIONS, input.limit ?? 12));

  const mediaResult = await supabase
    .from("media")
    .select("id, uploaded_at")
    .eq("tenant_id", input.tenantId)
    .eq("project_id", input.projectId)
    .order("uploaded_at", { ascending: false })
    .limit(MAX_MEDIA_SCAN);

  if (mediaResult.error) {
    throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_site_observations:media", 503);
  }

  const mediaRows = (mediaResult.data ?? []) as MediaRow[];
  if (mediaRows.length === 0) return [];

  const out: PersistedSiteObservation[] = [];

  for (let offset = 0; offset < mediaRows.length && out.length < limit; offset += ANALYSIS_QUERY_BATCH) {
    const batch = mediaRows.slice(offset, offset + ANALYSIS_QUERY_BATCH);
    const latestResults = await Promise.all(
      batch.map(async (media) => {
        const result = await supabase
          .from("ai_analysis")
          .select(ANALYSIS_SELECT)
          .eq("media_id", media.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return { media, result };
      })
    );

    for (const { media, result } of latestResults) {
      if (result.error) {
        throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_site_observations:analysis", 503);
      }
      const row = ((result.data ?? []) as AnalysisRow[])[0];
      if (!row) continue;
      if (row.media_id !== media.id) {
        throw new AgentError("AGENT_SKILL_FAILED", "scope_mismatch:get_site_observations:analysis_media", 503);
      }

      out.push(buildPersistedObservation(input.projectId, media, row));
      if (out.length >= limit) break;
    }
  }

  return out;
}

function buildPersistedObservation(
  projectId: string,
  media: MediaRow,
  row: AnalysisRow
): PersistedSiteObservation {
  const analysisCreatedAt = canonicalPersistedTimestamp(row.created_at);
  if (!analysisCreatedAt) {
    throw new AgentError(
      "AGENT_SKILL_FAILED",
      "invalid_persisted_timestamp:get_site_observations:analysis",
      503
    );
  }

  const result: AnalysisResult = {
    stage: row.stage?.trim() || "unknown",
    completion_percent: typeof row.completion_percent === "number" ? row.completion_percent : 0,
    risk_level: normalizeRiskLevel(row.risk_level),
    detected_issues: stringArray(row.detected_issues),
    recommendations: stringArray(row.recommendations),
  };

  const observation = normalizeImageSiteObservation(result, {
    projectId,
    mediaId: media.id,
    capturedAt: media.uploaded_at ?? undefined,
  });

  observation.evidence.push(
    toAgentEvidence({
      type: "DATABASE_STATE",
      sourceEntityType: "ai_analysis",
      sourceEntityId: row.id,
      capturedAt: analysisCreatedAt,
      metadata: {
        mediaId: media.id,
        jobId: row.job_id,
        persistentSource: true,
        observationProvenanceComplete: !observation.insufficientEvidence,
      },
    })
  );

  return {
    analysisId: row.id,
    jobId: row.job_id,
    analysisCreatedAt,
    observation,
  };
}

function normalizeRiskLevel(value: string | null): "low" | "medium" | "high" {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
  return "medium";
}

function stringArray(value: string[] | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function canonicalPersistedTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|([+-])(\d{2}):(\d{2}))$/
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (year < 1970 || year > 9999 || month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
