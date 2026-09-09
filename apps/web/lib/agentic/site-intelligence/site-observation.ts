import type { AnalysisResult, DailyWorkVideoAnalysis } from "@aistroyka/contracts";
import { toAgentEvidence, type AgentEvidence } from "../contracts/evidence.types";

/**
 * Site Intelligence observation contract.
 *
 * Deterministic normalization only: no model call, no graph write, no system-of-record
 * promotion. Legacy media currently exposes `uploaded_at`, not a verified camera capture
 * timestamp. The contract therefore records timestamp semantics explicitly and never
 * promotes upload time into a verified capture-time fact.
 */

export const SITE_OBSERVATION_SCHEMA_VERSION = 3 as const;

export type SiteObservationSource = "IMAGE_ANALYSIS" | "VIDEO_DAILY_ANALYSIS";
export type SiteObservationSignalKind = "ACTIVITY" | "ISSUE" | "MATERIAL" | "VISIBILITY";
export type SiteObservationTimeSemantics = "CAPTURED_AT" | "MEDIA_UPLOADED_AT";

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
  evidenceTime: string | null;
  evidenceTimeSemantics: SiteObservationTimeSemantics | null;
  evidence: AgentEvidence[];
  insufficientEvidence: boolean;
}

export interface SiteObservationScope {
  projectId?: string | null;
  mediaId?: string | null;
  capturedAt?: string | null;
  uploadedAt?: string | null;
}

interface ResolvedEvidenceTime {
  value: string;
  semantics: SiteObservationTimeSemantics;
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
  const evidenceTime = resolveEvidenceTime(scope);
  const limitations = scopeLimitations(projectId, mediaId, evidenceTime);
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
    evidenceTime: evidenceTime?.value ?? null,
    evidenceTimeSemantics: evidenceTime?.semantics ?? null,
    evidence: buildMediaEvidence("IMAGE_ANALYSIS", projectId, mediaId, evidenceTime),
    insufficientEvidence: !projectId || !mediaId || !evidenceTime,
  };
}

export function normalizeVideoDailySiteObservation(
  result: DailyWorkVideoAnalysis,
  scope: SiteObservationScope
): SiteObservation {
  const projectId = normalizeId(scope.projectId);
  const mediaId = normalizeId(scope.mediaId);
  const evidenceTime = resolveEvidenceTime(scope);
  const workDate = normalizeWorkDate(result.work_date);
  const limitations = scopeLimitations(projectId, mediaId, evidenceTime);
  if (!workDate) limitations.push("UNKNOWN_WORK_DATE");

  const observations = uniqueSignals([
    ...boundedStrings(result.activities_observed, MAX_SIGNALS).map((text) => ({
      kind: "ACTIVITY" as const,
      text,
      sourceField: "activities_observed",
    })),
    ...boundedStrings(result.materials_or_equipment_visible ?? [], MAX_SIGNALS).map((text) => ({
      kind: "MATERIAL" as const,
      text,
      sourceField: "materials_or_equipment_visible",
    })),
    ...boundedStrings(result.issues_and_risks, MAX_SIGNALS).map((text) => ({
      kind: "ISSUE" as const,
      text,
      sourceField: "issues_and_risks",
    })),
    ...boundedStrings(result.visibility_notes ? [result.visibility_notes] : [], 1).map((text) => ({
      kind: "VISIBILITY" as const,
      text,
      sourceField: "visibility_notes",
    })),
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
    evidenceTime: evidenceTime?.value ?? null,
    evidenceTimeSemantics: evidenceTime?.semantics ?? null,
    evidence: buildMediaEvidence("VIDEO_DAILY_ANALYSIS", projectId, mediaId, evidenceTime),
    insufficientEvidence: !projectId || !mediaId || !evidenceTime,
  };
}

/**
 * Graph projection is stricter than read-only evidence use: legacy upload timestamps
 * are acceptable for displaying/analyzing persisted media, but cannot establish when
 * the photographed condition actually existed. Projection waits for verified capture time.
 */
export function isSiteObservationProjectionEligible(observation: SiteObservation): boolean {
  return Boolean(
    observation.projectId &&
      observation.mediaId &&
      observation.evidence.length > 0 &&
      !observation.insufficientEvidence &&
      observation.evidenceTimeSemantics === "CAPTURED_AT"
  );
}

function buildMediaEvidence(
  source: SiteObservationSource,
  projectId: string | null,
  mediaId: string | null,
  evidenceTime: ResolvedEvidenceTime | null
): AgentEvidence[] {
  if (!projectId || !mediaId || !evidenceTime) return [];

  const isVerifiedCapture = evidenceTime.semantics === "CAPTURED_AT";
  return [
    toAgentEvidence({
      // Never put a legacy upload timestamp into PHOTO/VIDEO capture evidence. For
      // unverified legacy rows, persist only the fact that the media row existed at
      // its upload timestamp; the SiteObservation carries the explicit semantics.
      type: isVerifiedCapture
        ? source === "IMAGE_ANALYSIS"
          ? "PHOTO"
          : "VIDEO"
        : "DATABASE_STATE",
      sourceEntityType: "media",
      sourceEntityId: mediaId,
      capturedAt: evidenceTime.value,
      metadata: {
        projectId,
        siteObservationSource: source,
        modelDerived: true,
        timestampSemantics: evidenceTime.semantics,
        captureTimeVerified: isVerifiedCapture,
      },
    }),
  ];
}

function scopeLimitations(
  projectId: string | null,
  mediaId: string | null,
  evidenceTime: ResolvedEvidenceTime | null
): string[] {
  const limitations: string[] = [];
  if (!projectId) limitations.push("UNSCOPED_PROJECT");
  if (!mediaId) limitations.push("MISSING_MEDIA_EVIDENCE");
  if (!evidenceTime) limitations.push("MISSING_EVIDENCE_TIME");
  if (evidenceTime?.semantics === "MEDIA_UPLOADED_AT") {
    limitations.push("CAPTURE_TIME_UNVERIFIED");
  }
  return limitations;
}

function resolveEvidenceTime(scope: SiteObservationScope): ResolvedEvidenceTime | null {
  const capturedAt = normalizeTimestamp(scope.capturedAt);
  if (capturedAt) return { value: capturedAt, semantics: "CAPTURED_AT" };

  const uploadedAt = normalizeTimestamp(scope.uploadedAt);
  if (uploadedAt) return { value: uploadedAt, semantics: "MEDIA_UPLOADED_AT" };

  return null;
}

function normalizeId(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTimestamp(value?: string | null): string | null {
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

  if (match[8] !== "Z") {
    const offsetHour = Number(match[10]);
    const offsetMinute = Number(match[11]);
    if (offsetHour > 14 || offsetMinute > 59) return null;
    if (offsetHour === 14 && offsetMinute !== 0) return null;
  }

  const parsedMs = Date.parse(normalized);
  if (!Number.isFinite(parsedMs)) return null;
  return new Date(parsedMs).toISOString();
}

function normalizeStage(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return null;
  return normalized.slice(0, 120);
}

function normalizeWorkDate(value: string): string | null {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1970 || year > 9999 || month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return normalized;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
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
