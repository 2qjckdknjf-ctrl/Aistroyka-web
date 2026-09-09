import type { AnalysisResult, DailyWorkVideoAnalysis } from "@aistroyka/contracts";
import { toAgentEvidence, type AgentEvidence } from "../contracts/evidence.types";

/**
 * Site Intelligence Slice 01.
 *
 * This is a deterministic normalization contract over existing vision outputs.
 * It does not call an LLM, write to the Construction Graph, or promote model output
 * into a system-of-record fact. Graph projection is intentionally deferred until
 * the source analysis itself has durable provenance.
 */

export const SITE_OBSERVATION_SCHEMA_VERSION = 2 as const;

export type SiteObservationSource = "IMAGE_ANALYSIS" | "VIDEO_DAILY_ANALYSIS";
export type SiteObservationSignalKind = "ACTIVITY" | "ISSUE" | "MATERIAL" | "VISIBILITY";

export interface SiteObservationSignal {
  kind: SiteObservationSignalKind;
  text: string;
  sourceField: string;
}

export interface SiteObservation {
  schemaVersion: typeof SITE_OBSERVATION_SCHEMA_VERSION;
  source: SiteObservationSource;
  projectId: string | null;
  mediaId: string | null;
  workDate: string | null;
  stage: string | null;
  completionPercent: number;
  riskLevel: "low" | "medium" | "high";
  observations: SiteObservationSignal[];
  recommendations: string[];
  limitations: string[];
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
}

export interface SiteObservationScope {
  projectId?: string | null;
  mediaId?: string | null;
  /** Trusted media capture/upload timestamp. Missing/invalid provenance fails closed. */
  capturedAt?: string;
}

const MAX_SIGNALS = 32;
const MAX_RECOMMENDATIONS = 24;
const MAX_TEXT_LENGTH = 500;

export function normalizeImageSiteObservation(
  result: AnalysisResult,
  scope: SiteObservationScope
): SiteObservation {
  const projectId = normalizeId(scope.projectId);
  const mediaId = normalizeId(scope.mediaId);
  const capturedAt = normalizeCapturedAt(scope.capturedAt);
  const limitations = scopeLimitations(projectId, mediaId, capturedAt);
  const stage = normalizeStage(result.stage);

  const observations = uniqueSignals(
    boundedStrings(result.detected_issues, MAX_SIGNALS).map((text) => ({
      kind: "ISSUE" as const,
      text,
      sourceField: "detected_issues",
    }))
  );

  return {
    schemaVersion: SITE_OBSERVATION_SCHEMA_VERSION,
    source: "IMAGE_ANALYSIS",
    projectId,
    mediaId,
    workDate: null,
    stage,
    completionPercent: normalizePercent(result.completion_percent),
    riskLevel: result.risk_level,
    observations,
    recommendations: boundedStrings(result.recommendations, MAX_RECOMMENDATIONS),
    limitations,
    evidence: buildMediaEvidence("IMAGE_ANALYSIS", projectId, mediaId, capturedAt),
    insufficientEvidence: !projectId || !mediaId || !capturedAt,
  };
}

export function normalizeVideoDailySiteObservation(
  result: DailyWorkVideoAnalysis,
  scope: SiteObservationScope
): SiteObservation {
  const projectId = normalizeId(scope.projectId);
  const mediaId = normalizeId(scope.mediaId);
  const capturedAt = normalizeCapturedAt(scope.capturedAt);
  const workDate = normalizeWorkDate(result.work_date);
  const limitations = scopeLimitations(projectId, mediaId, capturedAt);
  if (!workDate) limitations.push("UNKNOWN_WORK_DATE");

  // Safety-relevant signals are ordered first. The upstream video sanitizer allows
  // up to 24 issue entries plus one visibility note, so the 32-item overall cap
  // cannot be exhausted by activities/materials before hazards are retained.
  const issueSignals = boundedStrings(result.issues_and_risks, MAX_SIGNALS).map((text) => ({
    kind: "ISSUE" as const,
    text,
    sourceField: "issues_and_risks",
  }));
  const visibilitySignals = boundedStrings(result.visibility_notes ? [result.visibility_notes] : [], 1).map((text) => ({
    kind: "VISIBILITY" as const,
    text,
    sourceField: "visibility_notes",
  }));
  const activitySignals = boundedStrings(result.activities_observed, MAX_SIGNALS).map((text) => ({
    kind: "ACTIVITY" as const,
    text,
    sourceField: "activities_observed",
  }));
  const materialSignals = boundedStrings(result.materials_or_equipment_visible ?? [], MAX_SIGNALS).map((text) => ({
    kind: "MATERIAL" as const,
    text,
    sourceField: "materials_or_equipment_visible",
  }));

  const observations = uniqueSignals([
    ...issueSignals,
    ...visibilitySignals,
    ...activitySignals,
    ...materialSignals,
  ]).slice(0, MAX_SIGNALS);

  return {
    schemaVersion: SITE_OBSERVATION_SCHEMA_VERSION,
    source: "VIDEO_DAILY_ANALYSIS",
    projectId,
    mediaId,
    workDate,
    stage: null,
    completionPercent: normalizePercent(result.completion_estimate_percent),
    riskLevel: result.risk_level,
    observations,
    recommendations: boundedStrings(result.recommendations, MAX_RECOMMENDATIONS),
    limitations,
    evidence: buildMediaEvidence("VIDEO_DAILY_ANALYSIS", projectId, mediaId, capturedAt),
    insufficientEvidence: !projectId || !mediaId || !capturedAt,
  };
}

/**
 * A normalized observation is eligible for a later governed graph-projection step
 * only when it is bound to an existing project/media object and real capture time.
 * This function does not perform that projection.
 */
export function isSiteObservationProjectionEligible(observation: SiteObservation): boolean {
  return Boolean(
    observation.projectId &&
      observation.mediaId &&
      observation.evidence.length > 0 &&
      !observation.insufficientEvidence
  );
}

function buildMediaEvidence(
  source: SiteObservationSource,
  projectId: string | null,
  mediaId: string | null,
  capturedAt: string | null
): AgentEvidence[] {
  if (!projectId || !mediaId || !capturedAt) return [];
  return [
    toAgentEvidence({
      type: source === "IMAGE_ANALYSIS" ? "PHOTO" : "VIDEO",
      sourceEntityType: "media",
      sourceEntityId: mediaId,
      capturedAt,
      metadata: {
        projectId,
        siteObservationSource: source,
        modelDerived: true,
      },
    }),
  ];
}

function scopeLimitations(
  projectId: string | null,
  mediaId: string | null,
  capturedAt: string | null
): string[] {
  const limitations: string[] = [];
  if (!projectId) limitations.push("UNSCOPED_PROJECT");
  if (!mediaId) limitations.push("MISSING_MEDIA_EVIDENCE");
  if (!capturedAt) limitations.push("MISSING_CAPTURE_TIME");
  return limitations;
}

function normalizeId(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeStage(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return null;
  return normalized.slice(0, 120);
}

function normalizeWorkDate(value: string): string | null {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === normalized ? normalized : null;
}

/**
 * Evidence timestamps must be real, stable provenance. Accept strict UTC RFC3339
 * timestamps only; callers with DB timestamptz values should canonicalize them first.
 */
function normalizeCapturedAt(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(normalized)) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  const iso = parsed.toISOString();
  const inputSecond = normalized.slice(0, 19);
  if (iso.slice(0, 19) !== inputSecond) return null;
  return iso;
}

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function boundedStrings(values: readonly string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, MAX_TEXT_LENGTH);
    if (!value) continue;
    const key = value.toLocaleLowerCase("en-US");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function uniqueSignals(signals: SiteObservationSignal[]): SiteObservationSignal[] {
  const seen = new Set<string>();
  const out: SiteObservationSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.kind}:${signal.text.toLocaleLowerCase("en-US")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
    if (out.length >= MAX_SIGNALS) break;
  }
  return out;
}
