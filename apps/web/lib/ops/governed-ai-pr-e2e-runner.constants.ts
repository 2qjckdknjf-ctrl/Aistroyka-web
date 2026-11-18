/**
 * Trust boundary constants for governed AI PR Preview E2E.
 * Preview URL authority comes from GitHub Deployment binding, not static hostnames.
 */
export const GOVERNED_AI_REPOSITORY_FULL_NAME = "2qjckdknjf-ctrl/Aistroyka-web" as const;

export const GOVERNED_AI_PREVIEW_ENVIRONMENT = "Preview" as const;

/** Defense-in-depth: Vercel project slug segment in Preview hostnames. */
export const GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX = "aistroyka-web-web-v7jq-" as const;

/** Defense-in-depth: Vercel team/projects suffix for this repository. */
export const GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX = "-2qjckdknjf-ctrls-projects.vercel.app" as const;

/** Official Vercel for GitHub GitHub App (https://github.com/apps/vercel). */
export const VERCEL_GITHUB_APP_ID = 8329 as const;
export const VERCEL_GITHUB_APP_SLUG = "vercel" as const;

/** Deployment records for this repository are created by vercel[bot]. */
export const VERCEL_DEPLOYMENT_BOT_LOGIN = "vercel[bot]" as const;
export const VERCEL_DEPLOYMENT_BOT_ID = 35613825 as const;

export const GOVERNED_AI_PR_E2E_STAGING_ENVIRONMENT = "staging" as const;

export const GOVERNED_AI_PR_E2E_CONFIRMATION = "RUN_GOVERNED_AI_STAGING_E2E" as const;

export const GOVERNED_AI_STAGING_SUPABASE_ORIGIN =
  "https://vthfrxehrursfloevnlp.supabase.co" as const;

export type StagingSupabaseOriginValidationFailure = {
  ok: false;
  code: "BLOCKED_STAGING_SUPABASE_ORIGIN";
  message: string;
};

export type StagingSupabaseOriginValidationSuccess = { ok: true };

export type StagingSupabaseOriginValidationResult =
  | StagingSupabaseOriginValidationSuccess
  | StagingSupabaseOriginValidationFailure;

export function validateStagingSupabaseOrigin(input: string): StagingSupabaseOriginValidationResult {
  const normalized = input.trim().replace(/\/+$/, "");
  if (normalized !== GOVERNED_AI_STAGING_SUPABASE_ORIGIN) {
    return {
      ok: false,
      code: "BLOCKED_STAGING_SUPABASE_ORIGIN",
      message: `staging Supabase URL must be exactly ${GOVERNED_AI_STAGING_SUPABASE_ORIGIN}`,
    };
  }
  return { ok: true };
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
