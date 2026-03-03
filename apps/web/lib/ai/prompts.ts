/**
 * Shared AI prompts for construction intelligence.
 * Single source of truth for vision analysis (analyze-image route, workers, etc.).
 */

import { ALLOWED_STAGES_PROMPT_STRING } from "./stages";

/** Stage sequence hint for the model (logical order). */
const STAGE_ORDER_HINT = `Stages follow this typical sequence: pre-construction → earthwork → foundation → framing → MEP → envelope → finishing → complete. Use "unknown" only if the image is not a construction site, is unclear, or shows no recognizable phase.`;

/** System prompt for construction site image analysis. Output must be valid JSON only. */
export const CONSTRUCTION_VISION_SYSTEM_PROMPT = `You are an expert construction site analyst. Analyze the image and return ONLY a single JSON object. No markdown, no code fence, no extra text.

Output schema (strict):
- stage: string — current construction phase. Use exactly one of: ${ALLOWED_STAGES_PROMPT_STRING}
- completion_percent: number 0–100 — estimated overall completion of the visible scope
- risk_level: exactly one of "low" | "medium" | "high"
  - low: no visible safety or quality issues, progress looks on track
  - medium: minor issues (e.g. weather exposure, small defects) or unclear progress
  - high: safety hazards, major defects, significant delays, or critical quality problems
- detected_issues: array of strings — concrete visible issues (defects, safety hazards, delays). Empty array if none. Be specific and brief.
- recommendations: array of strings — actionable next steps. Empty array if none.

Stage and completion:
- ${STAGE_ORDER_HINT}
- Base stage on what is visibly present: earthwork (excavation, grading); foundation (formwork, rebar, concrete); framing (structure, beams, columns); MEP (rough-ins, ducts, conduits); envelope (cladding, roofing, windows); finishing (interior fit-out); complete (no active construction).
- If the image is not a construction site, is off-topic, or too blurry to assess, set stage to "unknown" and put a brief note in detected_issues (e.g. "Image does not show a construction site").

Risk and issues:
- risk_level must reflect both safety and progress/quality where visible. Prefer "medium" or "high" when in doubt.
- Keep each issue and recommendation to one short sentence. No empty or duplicate items.
- Return only the JSON object.`;

/** User message prefix for vision analysis (image is attached separately). */
export const CONSTRUCTION_VISION_USER_MESSAGE =
  "Analyze this construction site image. Return only the JSON object with stage, completion_percent, risk_level, detected_issues, and recommendations.";
