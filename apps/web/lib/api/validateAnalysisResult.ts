/**
 * Runtime validation for AI analysis result JSON.
 * Required structure: stage, completion_percent, risk_level, detected_issues, recommendations.
 */

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface ValidAnalysisResult {
  stage: string;
  completion_percent: number;
  risk_level: RiskLevel;
  detected_issues: string[];
  recommendations: string[];
}

export interface ValidationError {
  success: false;
  error: string;
  details?: string;
}

export interface ValidationSuccess {
  success: true;
  data: ValidAnalysisResult;
}

export type ValidationOutcome = ValidationSuccess | ValidationError;

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(isString);
}

/**
 * Validates that the value matches the required AI result structure.
 * Returns { success: true, data } or { success: false, error, details? }.
 */
export function validateAnalysisResult(raw: unknown): ValidationOutcome {
  if (raw == null || typeof raw !== "object") {
    return {
      success: false,
      error: "Invalid result: not an object",
      details: String(raw),
    };
  }

  const o = raw as Record<string, unknown>;

  if (!isString(o.stage)) {
    return {
      success: false,
      error: "Invalid result: stage must be a string",
      details: `stage = ${JSON.stringify(o.stage)}`,
    };
  }
  if (o.stage.trim() === "") {
    return {
      success: false,
      error: "Invalid result: stage must be non-empty",
      details: "stage is empty or whitespace",
    };
  }

  if (!isNumber(o.completion_percent)) {
    return {
      success: false,
      error: "Invalid result: completion_percent must be a number",
      details: `completion_percent = ${JSON.stringify(o.completion_percent)}`,
    };
  }
  if (
    o.completion_percent < 0 ||
    o.completion_percent > 100
  ) {
    return {
      success: false,
      error: "Invalid result: completion_percent must be 0–100",
      details: `completion_percent = ${o.completion_percent}`,
    };
  }

  if (!isString(o.risk_level) || !RISK_LEVELS.includes(o.risk_level as RiskLevel)) {
    return {
      success: false,
      error: "Invalid result: risk_level must be one of low, medium, high",
      details: `risk_level = ${JSON.stringify(o.risk_level)}`,
    };
  }

  if (!isStringArray(o.detected_issues)) {
    return {
      success: false,
      error: "Invalid result: detected_issues must be an array of strings",
      details: `detected_issues = ${JSON.stringify(o.detected_issues)}`,
    };
  }

  if (!isStringArray(o.recommendations)) {
    return {
      success: false,
      error: "Invalid result: recommendations must be an array of strings",
      details: `recommendations = ${JSON.stringify(o.recommendations)}`,
    };
  }

  return {
    success: true,
    data: {
      stage: o.stage,
      completion_percent: o.completion_percent,
      risk_level: o.risk_level as RiskLevel,
      detected_issues: o.detected_issues,
      recommendations: o.recommendations,
    },
  };
}
