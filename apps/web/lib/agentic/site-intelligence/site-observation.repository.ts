import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalysisResult } from "@aistroyka/contracts";
import { AgentError } from "../errors";
import { toAgentEvidence } from "../contracts/evidence.types";
import { normalizeImageSiteObservation, type SiteObservation } from "./site-observation";

const MAX_MEDIA_SCAN = 100;
const MAX_OBSERVATIONS = 30;

export interface PersistedSiteObservation {
  analysisId: string;
  jobId: string | null;
  analysisCreatedAt: string;
  observation: SiteObservation;
}

interface MediaRow { id: string; uploaded_at: string | null }
interface AnalysisRow {
  id: string; media_id: string; job_id: string | null; stage: string | null;
  completion_percent: number | null; risk_level: string | null;
  detected_issues: string[] | null; recommendations: string[] | null; created_at: string;
}

export async function listPersistedImageSiteObservations(
  supabase: SupabaseClient,
  input: { tenantId: string; projectId: string; limit?: number }
): Promise<PersistedSiteObservation[]> {
  const limit = Math.max(1, Math.min(MAX_OBSERVATIONS, input.limit ?? 12));
  const mediaResult = await supabase.from("media").select("id, uploaded_at")
    .eq("tenant_id", input.tenantId).eq("project_id", input.projectId)
    .order("uploaded_at", { ascending: false }).limit(MAX_MEDIA_SCAN);
  if (mediaResult.error) throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_site_observations:media", 503);
  const mediaRows = (mediaResult.data ?? []) as MediaRow[];
  if (mediaRows.length === 0) return [];

  const mediaById = new Map(mediaRows.map((row) => [row.id, row]));
  const mediaIds = mediaRows.map((row) => row.id);
  const analysisResult = await supabase.from("ai_analysis")
    .select("id, media_id, job_id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at")
    .in("media_id", mediaIds).order("created_at", { ascending: false })
    .limit(Math.min(MAX_MEDIA_SCAN, limit * 4));
  if (analysisResult.error) throw new AgentError("AGENT_SKILL_FAILED", "query_failed:get_site_observations:analysis", 503);

  const rows = (analysisResult.data ?? []) as AnalysisRow[];
  const seenMedia = new Set<string>();
  const out: PersistedSiteObservation[] = [];
  for (const row of rows) {
    if (seenMedia.has(row.media_id) || !mediaById.has(row.media_id)) continue;
    seenMedia.add(row.media_id);
    const analysisCreatedAt = canonicalPersistedTimestamp(row.created_at);
    if (!analysisCreatedAt) throw new AgentError("AGENT_SKILL_FAILED", "invalid_persisted_timestamp:get_site_observations:analysis", 503);

    const result: AnalysisResult = {
      stage: row.stage?.trim() || "unknown",
      completion_percent: typeof row.completion_percent === "number" ? row.completion_percent : 0,
      risk_level: normalizeRiskLevel(row.risk_level),
      detected_issues: stringArray(row.detected_issues),
      recommendations: stringArray(row.recommendations),
    };
    const media = mediaById.get(row.media_id)!;
    const observation = normalizeImageSiteObservation(result, {
      projectId: input.projectId,
      mediaId: row.media_id,
      capturedAt: media.uploaded_at ?? undefined,
    });
    observation.evidence.push(toAgentEvidence({
      type: "DATABASE_STATE",
      sourceEntityType: "ai_analysis",
      sourceEntityId: row.id,
      capturedAt: analysisCreatedAt,
      metadata: { mediaId: row.media_id, jobId: row.job_id, persistentSource: true, observationProvenanceComplete: !observation.insufficientEvidence },
    }));
    out.push({ analysisId: row.id, jobId: row.job_id, analysisCreatedAt, observation });
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeRiskLevel(value: string | null): "low" | "medium" | "high" {
  const normalized = value?.trim().toLowerCase();
  return normalized === "low" || normalized === "medium" || normalized === "high" ? normalized : "medium";
}
function stringArray(value: string[] | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function canonicalPersistedTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized)) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
