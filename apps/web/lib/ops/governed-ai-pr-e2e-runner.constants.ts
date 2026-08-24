/**
 * Canonical trust boundary for governed AI PR Preview E2E.
 * Changing the Preview hostname requires a reviewed workflow/constants update.
 */
export const GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME =
  "aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app" as const;

export const GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL =
  `https://${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}` as const;

export const GOVERNED_AI_PR_E2E_STAGING_ENVIRONMENT = "staging" as const;

export const GOVERNED_AI_PR_E2E_CONFIRMATION = "RUN_GOVERNED_AI_STAGING_E2E" as const;

export type PreviewUrlValidationFailure = {
  ok: false;
  code: string;
  message: string;
};

export type PreviewUrlValidationSuccess = {
  ok: true;
  canonicalBaseUrl: typeof GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL;
};

export type PreviewUrlValidationResult =
  | PreviewUrlValidationSuccess
  | PreviewUrlValidationFailure;

function fail(code: string, message: string): PreviewUrlValidationFailure {
  return { ok: false, code, message };
}

/**
 * Fail-closed Preview base URL validation. Returns the trusted canonical URL on success.
 */
export function validatePreviewBaseUrl(input: string): PreviewUrlValidationResult {
  const raw = input.trim();
  if (raw !== input) {
    return fail("PREVIEW_URL_WHITESPACE", "preview_base_url must not contain leading or trailing whitespace");
  }
  if (raw.includes("\\")) {
    return fail("PREVIEW_URL_ENCODED_TRICK", "preview_base_url must not contain backslashes");
  }
  if (raw.endsWith(".")) {
    return fail("PREVIEW_URL_TRAILING_DOT", "preview_base_url must not end with a trailing dot");
  }
  if (raw.includes("#")) {
    return fail("PREVIEW_URL_FRAGMENT", "preview_base_url must not contain a fragment");
  }
  if (raw.includes("?")) {
    return fail("PREVIEW_URL_QUERY", "preview_base_url must not contain a query string");
  }
  if (raw.includes("@")) {
    return fail("PREVIEW_URL_USERINFO", "preview_base_url must not contain username or password");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return fail("PREVIEW_URL_PARSE", "preview_base_url is not a valid URL");
  }

  if (parsed.protocol !== "https:") {
    return fail("PREVIEW_URL_PROTOCOL", "preview_base_url must use https");
  }
  if (parsed.username || parsed.password) {
    return fail("PREVIEW_URL_USERINFO", "preview_base_url must not contain username or password");
  }
  if (parsed.port) {
    return fail("PREVIEW_URL_PORT", "preview_base_url must not specify a port");
  }
  if (parsed.search) {
    return fail("PREVIEW_URL_QUERY", "preview_base_url must not contain a query string");
  }
  if (parsed.hash) {
    return fail("PREVIEW_URL_FRAGMENT", "preview_base_url must not contain a fragment");
  }
  if (parsed.pathname !== "" && parsed.pathname !== "/") {
    return fail("PREVIEW_URL_PATH", "preview_base_url must not contain a path");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME) {
    return fail(
      "PREVIEW_URL_HOST_MISMATCH",
      `preview_base_url hostname must exactly match ${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}`,
    );
  }

  return { ok: true, canonicalBaseUrl: GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL };
}

export type StagingEnvironmentProtectionResult =
  | {
      ok: true;
      protectionRuleCount: number;
      reviewerRuleCount: number;
      deploymentBranchPolicyCount: number;
    }
  | { ok: false; code: string; message: string };

export function evaluateStagingEnvironmentProtection(payload: {
  name?: string;
  protection_rules?: Array<{ type?: string; prevent_self_review?: boolean }>;
  deployment_branch_policy?: {
    protected_branches?: boolean;
    custom_branch_policies?: boolean;
  } | null;
  deployment_branch_policies?: Array<{ name?: string }>;
} | null): StagingEnvironmentProtectionResult {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_MISSING",
      message: "staging environment metadata is missing",
    };
  }
  if (payload.name !== GOVERNED_AI_PR_E2E_STAGING_ENVIRONMENT) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_NAME_MISMATCH",
      message: "expected GitHub Environment staging",
    };
  }
  const rules = payload.protection_rules ?? [];
  if (rules.length === 0) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED",
      message: "staging environment protection_rules must not be empty",
    };
  }
  const reviewerRuleCount = rules.filter((rule) => rule.type === "required_reviewers").length;
  if (reviewerRuleCount === 0) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED",
      message: "staging environment must configure required reviewers",
    };
  }
  const reviewerRules = rules.filter((rule) => rule.type === "required_reviewers");
  if (!reviewerRules.every((rule) => rule.prevent_self_review === true)) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED",
      message: "staging environment must prevent self-review on required reviewers",
    };
  }
  if (!payload.deployment_branch_policy?.custom_branch_policies) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED",
      message: "staging environment must restrict deployments to selected branches",
    };
  }
  const mainBranchPolicies = payload.deployment_branch_policies?.filter((policy) => policy.name === "main") ?? [];
  if (mainBranchPolicies.length !== 1 || payload.deployment_branch_policies?.length !== 1) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED",
      message: "staging environment deployment branch policy must allow only main",
    };
  }
  return {
    ok: true,
    protectionRuleCount: rules.length,
    reviewerRuleCount,
    deploymentBranchPolicyCount: mainBranchPolicies.length,
  };
}
