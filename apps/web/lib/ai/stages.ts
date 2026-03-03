/**
 * Canonical list of construction stages for vision analysis.
 * Used by prompts (system prompt text) and normalize (stage validation).
 */

export const ALLOWED_STAGES_LIST = [
  "pre-construction",
  "earthwork",
  "foundation",
  "framing",
  "MEP",
  "envelope",
  "finishing",
  "complete",
  "unknown",
] as const;

export type AllowedStage = (typeof ALLOWED_STAGES_LIST)[number];

export const ALLOWED_STAGES_SET = new Set(ALLOWED_STAGES_LIST.map((s) => s.toLowerCase()));

/** String for prompt: "a" | "b" | "c" */
export const ALLOWED_STAGES_PROMPT_STRING = ALLOWED_STAGES_LIST.map((s) => `"${s}"`).join(" | ");
