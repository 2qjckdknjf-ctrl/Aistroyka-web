/**
 * Build optional preference-pair fields for POST /api/v1/ai/feedback.
 * Returns null when required pair data is missing — never fabricates outputs.
 */

export interface PreferencePairFieldInput {
  aiRequestId?: string | null;
  taskType: string;
  audience?: string;
  inputContext?: Record<string, unknown>;
  originalOutput: unknown;
  chosenOutput: unknown;
}

export function buildPreferencePairFields(
  input: PreferencePairFieldInput
): Record<string, unknown> | null {
  if (!input.taskType.trim()) return null;
  if (!isJsonObject(input.originalOutput) || !isJsonObject(input.chosenOutput)) return null;

  return {
    aiRequestId: input.aiRequestId ?? undefined,
    taskType: input.taskType,
    audience: input.audience ?? "internal",
    inputContext: input.inputContext ?? {},
    rejectedOutput: input.originalOutput,
    chosenOutput: input.chosenOutput,
  };
}

function isJsonObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Wrap plain text as JSON object for preference pair payloads. */
export function textOutput(value: string): Record<string, unknown> {
  return { text: value };
}
