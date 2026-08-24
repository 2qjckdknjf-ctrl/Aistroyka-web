import {
  GOVERNED_AI_PREVIEW_ENVIRONMENT,
  GOVERNED_AI_REPOSITORY_FULL_NAME,
  GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX,
  GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX,
  VERCEL_GITHUB_APP_ID,
  VERCEL_GITHUB_APP_SLUG,
  VERCEL_DEPLOYMENT_BOT_ID,
  VERCEL_DEPLOYMENT_BOT_LOGIN,
} from "./governed-ai-pr-e2e-runner.constants";

export const GOVERNED_AI_DEPLOYMENT_TASK = "deploy" as const;

export const DEPLOYMENT_ID_MAX_LENGTH = 19;

/** GitHub deployment status states that fail binding when latest. */
export const DEPLOYMENT_STATUS_NON_SUCCESS_STATES = [
  "error",
  "failure",
  "inactive",
  "queued",
  "pending",
  "in_progress",
] as const;

export type ValidationFailure = {
  ok: false;
  code: string;
  message: string;
};

export type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function fail(code: string, message: string): ValidationFailure {
  return { ok: false, code, message };
}

export function validateDeploymentId(input: string): ValidationResult<string> {
  const raw = input.trim();
  if (raw !== input) {
    return fail("DEPLOYMENT_ID_WHITESPACE", "deployment_id must not contain leading or trailing whitespace");
  }
  if (raw.length === 0) {
    return fail("DEPLOYMENT_ID_EMPTY", "deployment_id is required");
  }
  if (raw.length > DEPLOYMENT_ID_MAX_LENGTH) {
    return fail("DEPLOYMENT_ID_TOO_LONG", `deployment_id must be at most ${DEPLOYMENT_ID_MAX_LENGTH} digits`);
  }
  if (!/^[1-9][0-9]*$/.test(raw)) {
    return fail(
      "DEPLOYMENT_ID_FORMAT",
      "deployment_id must be a positive decimal integer without sign, exponent, or non-digit characters",
    );
  }
  return { ok: true, value: raw };
}

export type NormalizedPreviewOrigin = {
  origin: string;
  hostname: string;
};

export function normalizePreviewOrigin(input: string): ValidationResult<NormalizedPreviewOrigin> {
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
  if (hostname !== parsed.hostname) {
    return fail("PREVIEW_URL_HOSTCASE", "preview_base_url hostname must be ASCII lowercase");
  }
  if (/[^\x00-\x7F]/.test(hostname) || hostname.includes("xn--")) {
    return fail("PREVIEW_URL_PUNYCODE", "preview_base_url hostname must not use punycode or non-ASCII labels");
  }
  if (!hostname.endsWith(".vercel.app")) {
    return fail("PREVIEW_URL_NOT_VERCEL", "preview_base_url hostname must end with .vercel.app");
  }

  const defense = validatePreviewHostnameDefenseInDepth(hostname);
  if (!defense.ok) {
    return defense;
  }

  return { ok: true, value: { origin: `https://${hostname}`, hostname } };
}

export function validatePreviewHostnameDefenseInDepth(hostname: string): ValidationResult<string> {
  const expectedPrefix = `${GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX}`;
  const expectedSuffix = GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX;
  if (!hostname.startsWith(expectedPrefix)) {
    return fail(
      "PREVIEW_URL_PROJECT_MISMATCH",
      `preview hostname must start with ${expectedPrefix} (AISTROYKA Vercel project defense-in-depth)`,
    );
  }
  if (!hostname.endsWith(expectedSuffix)) {
    return fail(
      "PREVIEW_URL_TEAM_MISMATCH",
      `preview hostname must end with ${expectedSuffix} (team defense-in-depth)`,
    );
  }
  const middle = hostname.slice(expectedPrefix.length, hostname.length - expectedSuffix.length);
  if (!/^[a-z0-9]+$/.test(middle)) {
    return fail("PREVIEW_URL_DEPLOYMENT_TOKEN", "preview hostname deployment token must be lowercase alphanumeric");
  }
  if (middle.length < 4) {
    return fail("PREVIEW_URL_DEPLOYMENT_TOKEN", "preview hostname deployment token is too short");
  }
  return { ok: true, value: hostname };
}

export function validatePreviewUrlMatchesTrusted(
  trustedOrigin: string,
  inputUrl: string,
): ValidationResult<string> {
  const trusted = normalizePreviewOrigin(trustedOrigin);
  if (!trusted.ok) {
    return trusted;
  }
  const provided = normalizePreviewOrigin(inputUrl);
  if (!provided.ok) {
    return provided;
  }
  if (trusted.value.origin !== provided.value.origin) {
    return fail(
      "PREVIEW_URL_TRUST_MISMATCH",
      "preview_base_url must exactly match trusted GitHub deployment environment_url",
    );
  }
  return { ok: true, value: trusted.value.origin };
}

export type DeploymentCreator = {
  login?: string;
  id?: number;
  type?: string;
};

export type GitHubDeploymentRecord = {
  id?: number;
  sha?: string;
  task?: string;
  environment?: string;
  repository_url?: string;
  creator?: DeploymentCreator;
  performed_via_github_app?: { id?: number; slug?: string } | null;
};

export type GitHubDeploymentStatusRecord = {
  id?: number;
  state?: string;
  environment?: string;
  environment_url?: string | null;
  target_url?: string | null;
  created_at?: string;
  deployment_url?: string;
  creator?: DeploymentCreator;
  performed_via_github_app?: { id?: number; slug?: string } | null;
};

export function isExactTrustedVercelBot(actor: DeploymentCreator | undefined | null): boolean {
  if (!actor || actor.type !== "Bot") {
    return false;
  }
  return actor.login === VERCEL_DEPLOYMENT_BOT_LOGIN && actor.id === VERCEL_DEPLOYMENT_BOT_ID;
}

export function isTrustedVercelGithubApp(app: { id?: number; slug?: string } | null | undefined): boolean {
  if (!app) {
    return false;
  }
  return app.id === VERCEL_GITHUB_APP_ID && app.slug === VERCEL_GITHUB_APP_SLUG;
}

export type ProvenanceMethod = "github_app_metadata" | "exact_bot_identity_fallback";

export function resolveProvenanceMethod(record: {
  creator?: { login?: string; id?: number } | null;
  performed_via_github_app?: { id?: number; slug?: string } | null;
}): ProvenanceMethod {
  if (isTrustedVercelGithubApp(record.performed_via_github_app)) {
    return "github_app_metadata";
  }
  return "exact_bot_identity_fallback";
}

export function validateDeploymentProvenance(deployment: GitHubDeploymentRecord): ValidationResult<true> {
  const repoFromDeployment = repositoryFullNameFromApiUrl(deployment.repository_url);
  if (repoFromDeployment !== GOVERNED_AI_REPOSITORY_FULL_NAME) {
    return fail("DEPLOYMENT_REPO_MISMATCH", "deployment does not belong to the trusted repository");
  }
  if (deployment.task !== GOVERNED_AI_DEPLOYMENT_TASK) {
    return fail("DEPLOYMENT_TASK_MISMATCH", `deployment task must be exactly ${GOVERNED_AI_DEPLOYMENT_TASK}`);
  }
  if (deployment.environment !== GOVERNED_AI_PREVIEW_ENVIRONMENT) {
    return fail("DEPLOYMENT_ENV_MISMATCH", `deployment environment must be exactly ${GOVERNED_AI_PREVIEW_ENVIRONMENT}`);
  }

  const botTrusted = isExactTrustedVercelBot(deployment.creator);
  const appTrusted = isTrustedVercelGithubApp(deployment.performed_via_github_app);
  if (!botTrusted && !appTrusted) {
    if (deployment.creator?.login === VERCEL_DEPLOYMENT_BOT_LOGIN && deployment.creator.id !== VERCEL_DEPLOYMENT_BOT_ID) {
      return fail("DEPLOYMENT_CREATOR_ID_MISMATCH", "deployment creator login/id pair is inconsistent with Vercel bot");
    }
    if (deployment.creator?.id === VERCEL_DEPLOYMENT_BOT_ID && deployment.creator.login !== VERCEL_DEPLOYMENT_BOT_LOGIN) {
      return fail("DEPLOYMENT_CREATOR_LOGIN_MISMATCH", "deployment creator login/id pair is inconsistent with Vercel bot");
    }
    if (deployment.performed_via_github_app && !appTrusted) {
      return fail("DEPLOYMENT_APP_UNTRUSTED", "deployment GitHub App identity is not the trusted Vercel app");
    }
    return fail(
      "DEPLOYMENT_CREATOR_UNTRUSTED",
      `deployment must be created by ${VERCEL_DEPLOYMENT_BOT_LOGIN} (id ${VERCEL_DEPLOYMENT_BOT_ID}) or GitHub App ${VERCEL_GITHUB_APP_SLUG} (id ${VERCEL_GITHUB_APP_ID})`,
    );
  }
  if (deployment.performed_via_github_app && !appTrusted) {
    return fail("DEPLOYMENT_APP_UNTRUSTED", "deployment GitHub App identity is not the trusted Vercel app");
  }

  return { ok: true, value: true };
}

/**
 * Authoritative deployment status must be created by exact Vercel bot login+id.
 * When performed_via_github_app is present it must match Vercel app id/slug.
 * When App metadata is absent, exact bot identity is the fail-closed fallback.
 */
export function validateStatusProvenance(status: GitHubDeploymentStatusRecord): ValidationResult<true> {
  if (!isExactTrustedVercelBot(status.creator)) {
    if (status.creator?.login === VERCEL_DEPLOYMENT_BOT_LOGIN && status.creator.id !== VERCEL_DEPLOYMENT_BOT_ID) {
      return fail("STATUS_CREATOR_ID_MISMATCH", "status creator login matches but immutable bot id differs");
    }
    if (status.creator?.id === VERCEL_DEPLOYMENT_BOT_ID && status.creator.login !== VERCEL_DEPLOYMENT_BOT_LOGIN) {
      return fail("STATUS_CREATOR_LOGIN_MISMATCH", "status creator id matches but login differs");
    }
    return fail(
      "STATUS_CREATOR_UNTRUSTED",
      `latest deployment status must be created by ${VERCEL_DEPLOYMENT_BOT_LOGIN} (id ${VERCEL_DEPLOYMENT_BOT_ID})`,
    );
  }
  if (status.performed_via_github_app != null && !isTrustedVercelGithubApp(status.performed_via_github_app)) {
    return fail("STATUS_APP_UNTRUSTED", "latest deployment status GitHub App identity is not the trusted Vercel app");
  }
  if (status.environment && status.environment !== GOVERNED_AI_PREVIEW_ENVIRONMENT) {
    return fail("STATUS_ENV_MISMATCH", `latest deployment status environment must be ${GOVERNED_AI_PREVIEW_ENVIRONMENT}`);
  }
  return { ok: true, value: true };
}

export function repositoryFullNameFromApiUrl(repositoryUrl: string | undefined): string | null {
  if (!repositoryUrl) {
    return null;
  }
  const marker = "/repos/";
  const idx = repositoryUrl.indexOf(marker);
  if (idx === -1) {
    return null;
  }
  const tail = repositoryUrl.slice(idx + marker.length).replace(/\/+$/, "");
  return tail.length > 0 ? tail : null;
}

export function compareLatestDeploymentStatus(
  a: GitHubDeploymentStatusRecord,
  b: GitHubDeploymentStatusRecord,
): number {
  const aTime = Date.parse(a.created_at ?? "") || 0;
  const bTime = Date.parse(b.created_at ?? "") || 0;
  if (bTime !== aTime) {
    return bTime - aTime;
  }
  return (b.id ?? 0) - (a.id ?? 0);
}

export function selectLatestDeploymentStatus(
  statuses: GitHubDeploymentStatusRecord[],
): GitHubDeploymentStatusRecord | null {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return null;
  }
  const sorted = [...statuses].sort(compareLatestDeploymentStatus);
  return sorted[0] ?? null;
}

export function validateLatestStatusState(state: string | undefined): ValidationResult<true> {
  if (!state) {
    return fail("DEPLOYMENT_STATUS_STATE_MISSING", "latest deployment status must include state");
  }
  if (state !== "success") {
    const normalized = state.toLowerCase();
    if ((DEPLOYMENT_STATUS_NON_SUCCESS_STATES as readonly string[]).includes(normalized)) {
      return fail("DEPLOYMENT_STATUS_NOT_SUCCESS", `latest deployment status must be success (got ${state})`);
    }
    return fail("DEPLOYMENT_STATUS_UNKNOWN", `latest deployment status state is not trusted (got ${state})`);
  }
  return { ok: true, value: true };
}

export type DeploymentBindingEvidence = {
  deployment_id: string;
  deployment_sha: string;
  deployment_task: string;
  environment: string;
  repository: string;
  deployment_creator_login: string;
  deployment_creator_id: number;
  status_creator_login: string;
  status_creator_id: number;
  observed_deployment_github_app_id: number | null;
  observed_deployment_github_app_slug: string | null;
  observed_status_github_app_id: number | null;
  observed_status_github_app_slug: string | null;
  deployment_provenance_method: ProvenanceMethod;
  status_provenance_method: ProvenanceMethod;
  latest_status_id: number;
  latest_status_state: string;
  latest_status_created_at: string;
  canonical_preview_url: string;
  input_preview_url: string;
};

export type DeploymentBindingSuccess = {
  ok: true;
  canonicalPreviewUrl: string;
  evidence: DeploymentBindingEvidence;
};

export type DeploymentBindingResult = DeploymentBindingSuccess | ValidationFailure;

export function validateDeploymentBinding(params: {
  repositoryFullName: string;
  targetSha: string;
  deploymentId: string;
  inputPreviewUrl: string;
  deployment: GitHubDeploymentRecord;
  statuses: GitHubDeploymentStatusRecord[];
  statusesFullyPaginated?: boolean;
}): DeploymentBindingResult {
  const idValidation = validateDeploymentId(params.deploymentId);
  if (!idValidation.ok) {
    return idValidation;
  }
  if (params.statusesFullyPaginated === false) {
    return fail("DEPLOYMENT_STATUS_PAGINATION_TRUNCATED", "deployment statuses pagination was truncated");
  }
  if (params.deployment.id !== Number(params.deploymentId)) {
    return fail("DEPLOYMENT_ID_MISMATCH", "GitHub deployment id does not match deployment_id input");
  }
  if (params.deployment.sha !== params.targetSha) {
    return fail("DEPLOYMENT_SHA_MISMATCH", "deployment SHA must exactly equal target_sha");
  }
  if (params.repositoryFullName !== GOVERNED_AI_REPOSITORY_FULL_NAME) {
    return fail("DEPLOYMENT_REPO_MISMATCH", "repositoryFullName must match trusted repository");
  }

  const deploymentProv = validateDeploymentProvenance(params.deployment);
  if (!deploymentProv.ok) {
    return deploymentProv;
  }

  const latest = selectLatestDeploymentStatus(params.statuses);
  if (!latest) {
    return fail("DEPLOYMENT_STATUS_MISSING", "deployment has no statuses");
  }

  const expectedDeploymentUrlSuffix = `/deployments/${params.deploymentId}`;
  if (latest.deployment_url && !latest.deployment_url.endsWith(expectedDeploymentUrlSuffix)) {
    return fail("STATUS_DEPLOYMENT_URL_MISMATCH", "latest status does not belong to the requested deployment");
  }

  const stateValidation = validateLatestStatusState(latest.state);
  if (!stateValidation.ok) {
    return stateValidation;
  }

  const statusProv = validateStatusProvenance(latest);
  if (!statusProv.ok) {
    return statusProv;
  }

  if (!latest.environment_url) {
    return fail("DEPLOYMENT_ENVIRONMENT_URL_MISSING", "latest deployment status must include environment_url");
  }

  const trustedUrl = normalizePreviewOrigin(latest.environment_url);
  if (!trustedUrl.ok) {
    return trustedUrl;
  }
  const inputMatch = validatePreviewUrlMatchesTrusted(trustedUrl.value.origin, params.inputPreviewUrl);
  if (!inputMatch.ok) {
    return inputMatch;
  }

  const evidence: DeploymentBindingEvidence = {
    deployment_id: params.deploymentId,
    deployment_sha: params.deployment.sha ?? params.targetSha,
    deployment_task: params.deployment.task ?? GOVERNED_AI_DEPLOYMENT_TASK,
    environment: params.deployment.environment ?? GOVERNED_AI_PREVIEW_ENVIRONMENT,
    repository: params.repositoryFullName,
    deployment_creator_login: params.deployment.creator?.login ?? VERCEL_DEPLOYMENT_BOT_LOGIN,
    deployment_creator_id: params.deployment.creator?.id ?? VERCEL_DEPLOYMENT_BOT_ID,
    status_creator_login: latest.creator?.login ?? VERCEL_DEPLOYMENT_BOT_LOGIN,
    status_creator_id: latest.creator?.id ?? VERCEL_DEPLOYMENT_BOT_ID,
    observed_deployment_github_app_id: params.deployment.performed_via_github_app?.id ?? null,
    observed_deployment_github_app_slug: params.deployment.performed_via_github_app?.slug ?? null,
    observed_status_github_app_id: latest.performed_via_github_app?.id ?? null,
    observed_status_github_app_slug: latest.performed_via_github_app?.slug ?? null,
    deployment_provenance_method: resolveProvenanceMethod(params.deployment),
    status_provenance_method: resolveProvenanceMethod(latest),
    latest_status_id: latest.id ?? 0,
    latest_status_state: latest.state ?? "unknown",
    latest_status_created_at: latest.created_at ?? "",
    canonical_preview_url: trustedUrl.value.origin,
    input_preview_url: inputMatch.value,
  };

  return {
    ok: true,
    canonicalPreviewUrl: trustedUrl.value.origin,
    evidence,
  };
}
