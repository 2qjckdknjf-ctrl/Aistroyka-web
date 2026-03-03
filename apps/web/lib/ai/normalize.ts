/**
 * Normalization helpers for AI analysis output (stage, JSON extraction, sanitization).
 */

import type { AnalysisResult } from "./types";
import { ALLOWED_STAGES_SET } from "./stages";

/** Re-export for consumers that need the set. */
export { ALLOWED_STAGES_SET as ALLOWED_STAGES } from "./stages";

export function normalizeStage(raw: string | undefined): string {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return s && ALLOWED_STAGES_SET.has(s) ? s : "unknown";
}

const MAX_ARRAY_ITEMS = 30;
const MAX_STRING_LENGTH = 500;

/**
 * Try to fix common LLM JSON mistakes (trailing commas) before parse.
 * Only removes trailing commas before } or ] to avoid breaking valid content.
 */
function tryFixTrailingCommas(jsonStr: string): string {
  return jsonStr.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Parse JSON from AI response. Tries direct parse, then strips ```json ... ```, then first { ... }.
 * Attempts to fix trailing commas if initial parse fails.
 */
export function parseJsonFromContent(content: string): unknown {
  const trimmed = content.trim();
  for (const candidate of [trimmed, tryFixTrailingCommas(trimmed)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  for (const candidate of [withoutFence, tryFixTrailingCommas(withoutFence)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      try {
        return JSON.parse(tryFixTrailingCommas(slice));
      } catch {
        // fall through to throw
      }
    }
  }
  throw new Error("AI returned non-JSON");
}

function sanitizeStringArray(arr: string[], maxItems: number, maxLen: number): string[] {
  const seen = new Set<string>();
  return arr
    .filter((s) => typeof s === "string")
    .map((s) => s.trim().slice(0, maxLen))
    .filter((s) => {
      if (s.length === 0 || seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .slice(0, maxItems);
}

/**
 * Sanitize analysis result: trim and cap issues/recommendations, dedupe.
 * Does not change stage, completion_percent, or risk_level.
 */
export function sanitizeAnalysisResult(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    detected_issues: sanitizeStringArray(
      result.detected_issues,
      MAX_ARRAY_ITEMS,
      MAX_STRING_LENGTH
    ),
    recommendations: sanitizeStringArray(
      result.recommendations,
      MAX_ARRAY_ITEMS,
      MAX_STRING_LENGTH
    ),
  };
}
