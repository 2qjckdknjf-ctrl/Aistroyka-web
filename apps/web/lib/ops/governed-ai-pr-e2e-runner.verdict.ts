export const GOVERNED_AI_E2E_SUCCESS_VERDICT = "PROVEN" as const;

export const GOVERNED_AI_E2E_REQUIRED_STEP_COUNT = 25 as const;

export const GOVERNED_AI_E2E_REQUIRED_STEPS: readonly number[] = Array.from(
  { length: GOVERNED_AI_E2E_REQUIRED_STEP_COUNT },
  (_, index) => index + 1,
);

export const GOVERNED_AI_E2E_ALLOWED_STEP_STATUS = "PASS" as const;

export const GOVERNED_AI_E2E_REJECTED_STEP_STATUSES = [
  "FAILED",
  "BLOCKED",
  "BLOCKED_EXTERNAL",
  "PARTIAL",
  "SKIPPED",
  "NOT_RUN",
] as const;

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

export type E2eStepResult = {
  step?: unknown;
  status?: unknown;
};

export type E2eStructuredOutput = {
  verdict?: unknown;
  base?: unknown;
  deployedSha7?: unknown;
  results?: unknown;
  error?: unknown;
  reason?: unknown;
  missingSecrets?: unknown;
  [key: string]: unknown;
};

export type E2eSuccessContext = {
  trustedCanonicalOrigin: string;
  targetSha: string;
};

function normalizeOrigin(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

export function validateE2eStepResults(results: unknown[]): E2eVerdictValidationResult {
  if (results.length !== GOVERNED_AI_E2E_REQUIRED_STEP_COUNT) {
    return fail(
      "E2E_STEP_COUNT_MISMATCH",
      `results must contain exactly ${GOVERNED_AI_E2E_REQUIRED_STEP_COUNT} entries`,
    );
  }

  const seenSteps = new Set<number>();

  for (const entry of results) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return fail("E2E_RESULTS_MALFORMED", "each results entry must be an object");
    }
    const stepResult = entry as E2eStepResult;
    if (typeof stepResult.step !== "number" || !Number.isInteger(stepResult.step)) {
      return fail("E2E_STEP_NOT_INTEGER", "each results.step must be an integer");
    }
    if (stepResult.step < 1 || stepResult.step > GOVERNED_AI_E2E_REQUIRED_STEP_COUNT) {
      return fail("E2E_STEP_OUT_OF_RANGE", `results.step must be within 1..${GOVERNED_AI_E2E_REQUIRED_STEP_COUNT}`);
    }
    if (seenSteps.has(stepResult.step)) {
      return fail("E2E_STEP_DUPLICATE", `duplicate results entry for step ${stepResult.step}`);
    }
    seenSteps.add(stepResult.step);

    if (typeof stepResult.status !== "string") {
      return fail("E2E_STEP_STATUS_MISSING", "each results entry must include string status");
    }
    if (stepResult.status !== GOVERNED_AI_E2E_ALLOWED_STEP_STATUS) {
      if ((GOVERNED_AI_E2E_REJECTED_STEP_STATUSES as readonly string[]).includes(stepResult.status)) {
        return fail("E2E_STEP_STATUS_REJECTED", `step ${stepResult.step} has rejected status ${stepResult.status}`);
      }
      return fail("E2E_STEP_STATUS_UNKNOWN", `step ${stepResult.step} has unknown status ${stepResult.status}`);
    }
  }

  for (const requiredStep of GOVERNED_AI_E2E_REQUIRED_STEPS) {
    if (!seenSteps.has(requiredStep)) {
      return fail("E2E_STEP_MISSING", `missing required step ${requiredStep}`);
    }
  }

  return { ok: true, verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT };
}

export function validateE2eStructuredOutput(
  payload: unknown,
  context?: E2eSuccessContext,
): E2eVerdictValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fail("E2E_MALFORMED_JSON", "redacted E2E output must be a JSON object");
  }
  const record = payload as E2eStructuredOutput;

  if ("error" in record && record.error != null && record.error !== "") {
    return fail("E2E_TOP_LEVEL_ERROR", "redacted E2E output must not include top-level error");
  }
  if ("reason" in record && typeof record.reason === "string" && record.reason.length > 0) {
    return fail("E2E_TOP_LEVEL_REASON", "redacted E2E output must not include top-level reason");
  }
  if ("missingSecrets" in record && record.missingSecrets != null) {
    return fail("E2E_TOP_LEVEL_MISSING_SECRETS", "redacted E2E output must not include missingSecrets");
  }

  if (typeof record.verdict !== "string") {
    return fail("E2E_VERDICT_MISSING", "redacted E2E output must include string verdict");
  }
  if (record.verdict !== GOVERNED_AI_E2E_SUCCESS_VERDICT) {
    return fail("E2E_VERDICT_NOT_PROVEN", `success requires exact verdict ${GOVERNED_AI_E2E_SUCCESS_VERDICT}`);
  }
  if (typeof record.base !== "string" || record.base.trim().length === 0) {
    return fail("E2E_BASE_MISSING", "redacted E2E output must include non-empty base URL");
  }
  if (typeof record.deployedSha7 !== "string" || record.deployedSha7.trim().length === 0) {
    return fail("E2E_DEPLOYED_SHA7_MISSING", "redacted E2E output must include deployedSha7");
  }
  if (!Array.isArray(record.results)) {
    return fail("E2E_RESULTS_MISSING", "redacted E2E output must include results array");
  }

  if (context) {
    if (normalizeOrigin(record.base) !== normalizeOrigin(context.trustedCanonicalOrigin)) {
      return fail("E2E_BASE_MISMATCH", "base must exactly equal trusted canonical Preview origin");
    }
    const expectedSha7 = context.targetSha.slice(0, 7);
    if (record.deployedSha7 !== expectedSha7) {
      return fail("E2E_SHA7_MISMATCH", "deployedSha7 must match first 7 chars of target_sha");
    }
  }

  return validateE2eStepResults(record.results);
}

export function validateE2eSuccessContract(
  exitCode: number,
  payload: unknown,
  context?: E2eSuccessContext,
): E2eVerdictValidationResult {
  if (!Number.isInteger(exitCode) || exitCode !== 0) {
    return fail("E2E_EXIT_NONZERO", "harness process exit code must be 0 for success");
  }
  return validateE2eStructuredOutput(payload, context);
}
