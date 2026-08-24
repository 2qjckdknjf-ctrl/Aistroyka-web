export const GOVERNED_AI_E2E_SUCCESS_VERDICT = "PROVEN" as const;

export type E2eVerdictFailure = {
  ok: false;
  code: string;
  message: string;
};

export type E2eVerdictSuccess = {
  ok: true;
  verdict: typeof GOVERNED_AI_E2E_SUCCESS_VERDICT;
};

export type E2eVerdictValidationResult = E2eVerdictSuccess | E2eVerdictFailure;

function fail(code: string, message: string): E2eVerdictFailure {
  return { ok: false, code, message };
}

export type E2eStructuredOutput = {
  verdict?: unknown;
  base?: unknown;
  results?: unknown;
  [key: string]: unknown;
};

export function validateE2eStructuredOutput(payload: unknown): E2eVerdictValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fail("E2E_MALFORMED_JSON", "redacted E2E output must be a JSON object");
  }
  const record = payload as E2eStructuredOutput;
  if (typeof record.verdict !== "string") {
    return fail("E2E_VERDICT_MISSING", "redacted E2E output must include string verdict");
  }
  if (record.verdict !== GOVERNED_AI_E2E_SUCCESS_VERDICT) {
    return fail("E2E_VERDICT_NOT_PROVEN", `success requires exact verdict ${GOVERNED_AI_E2E_SUCCESS_VERDICT}`);
  }
  if (typeof record.base !== "string" || record.base.trim().length === 0) {
    return fail("E2E_BASE_MISSING", "redacted E2E output must include non-empty base URL");
  }
  if (!Array.isArray(record.results)) {
    return fail("E2E_RESULTS_MISSING", "redacted E2E output must include results array");
  }
  for (const entry of record.results) {
    if (!entry || typeof entry !== "object") {
      return fail("E2E_RESULTS_MALFORMED", "each results entry must be an object");
    }
    const step = entry as { status?: unknown };
    if (step.status === "FAILED") {
      return fail("E2E_CONTRADICTORY_FAILED_STEP", "verdict PROVEN cannot coexist with FAILED step status");
    }
  }
  return { ok: true, verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT };
}

export function validateE2eSuccessContract(exitCode: number, payload: unknown): E2eVerdictValidationResult {
  if (!Number.isInteger(exitCode) || exitCode !== 0) {
    return fail("E2E_EXIT_NONZERO", "harness process exit code must be 0 for success");
  }
  return validateE2eStructuredOutput(payload);
}
