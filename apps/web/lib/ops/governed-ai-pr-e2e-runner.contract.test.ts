import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GOVERNED_AI_E2E_ALLOWED_STEP_STATUS,
  GOVERNED_AI_E2E_REQUIRED_STEP_COUNT,
  GOVERNED_AI_E2E_SUCCESS_VERDICT,
  validateE2eStepResults,
  validateE2eStructuredOutput,
  validateE2eSuccessContract,
} from "./governed-ai-pr-e2e-runner.verdict";
import {
  GOVERNED_AI_PREVIEW_ENVIRONMENT,
  GOVERNED_AI_REPOSITORY_FULL_NAME,
  GOVERNED_AI_STAGING_SUPABASE_ORIGIN,
  GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX,
  GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX,
  VERCEL_DEPLOYMENT_BOT_ID,
  VERCEL_DEPLOYMENT_BOT_LOGIN,
  VERCEL_GITHUB_APP_ID,
  evaluateStagingEnvironmentProtection,
  validateStagingSupabaseOrigin,
} from "./governed-ai-pr-e2e-runner.constants";
import {
  GOVERNED_AI_DEPLOYMENT_TASK,
  compareLatestDeploymentStatus,
  normalizePreviewOrigin,
  selectLatestDeploymentStatus,
  validateDeploymentBinding,
  validateDeploymentId,
  validateDeploymentProvenance,
  validateLatestStatusState,
  validatePreviewUrlMatchesTrusted,
  validateStatusProvenance,
  resolveProvenanceMethod,
  type GitHubDeploymentRecord,
  type GitHubDeploymentStatusRecord,
} from "./governed-ai-pr-e2e-runner.deployment-binding";

const root = resolve(__dirname, "../../../../");
const wf = readFileSync(resolve(root, ".github/workflows/governed-ai-pr-e2e-runner.yml"), "utf8");
const constantsSource = readFileSync(
  resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.constants.ts"),
  "utf8",
);

const TRUSTED_PREVIEW_URL =
  "https://aistroyka-web-web-v7jq-8of2zsc02-2qjckdknjf-ctrls-projects.vercel.app";
const OLD_STATIC_HOST =
  "https://aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app";
const TARGET_SHA = "628bb6b1ac08c1fffe9078ff6627774995c95fdb";
const DEPLOYMENT_ID = "6064462333";
const VERCEL_BOT = { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" };

function trustedDeployment(overrides: Partial<GitHubDeploymentRecord> = {}): GitHubDeploymentRecord {
  return {
    id: Number(DEPLOYMENT_ID),
    sha: TARGET_SHA,
    task: GOVERNED_AI_DEPLOYMENT_TASK,
    environment: GOVERNED_AI_PREVIEW_ENVIRONMENT,
    repository_url: `https://api.github.com/repos/${GOVERNED_AI_REPOSITORY_FULL_NAME}`,
    creator: VERCEL_BOT,
    performed_via_github_app: null,
    ...overrides,
  };
}

function trustedStatus(
  overrides: Partial<GitHubDeploymentStatusRecord> = {},
): GitHubDeploymentStatusRecord {
  return {
    id: 17234886426,
    state: "success",
    environment: GOVERNED_AI_PREVIEW_ENVIRONMENT,
    environment_url: TRUSTED_PREVIEW_URL,
    target_url: TRUSTED_PREVIEW_URL,
    created_at: "2026-08-24T14:11:58Z",
    deployment_url: `https://api.github.com/repos/${GOVERNED_AI_REPOSITORY_FULL_NAME}/deployments/${DEPLOYMENT_ID}`,
    creator: VERCEL_BOT,
    performed_via_github_app: null,
    ...overrides,
  };
}

function bind(
  inputPreview = TRUSTED_PREVIEW_URL,
  deployment = trustedDeployment(),
  statuses = [trustedStatus()],
  statusesFullyPaginated = true,
) {
  return validateDeploymentBinding({
    repositoryFullName: GOVERNED_AI_REPOSITORY_FULL_NAME,
    targetSha: TARGET_SHA,
    deploymentId: DEPLOYMENT_ID,
    inputPreviewUrl: inputPreview,
    deployment,
    statuses,
    statusesFullyPaginated,
  });
}

function allPassResults(): Array<{ step: number; status: string }> {
  return Array.from({ length: GOVERNED_AI_E2E_REQUIRED_STEP_COUNT }, (_, index) => ({
    step: index + 1,
    status: GOVERNED_AI_E2E_ALLOWED_STEP_STATUS,
  }));
}

function provenPayload(overrides: Record<string, unknown> = {}) {
  return {
    verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT,
    base: TRUSTED_PREVIEW_URL,
    deployedSha7: TARGET_SHA.slice(0, 7),
    results: allPassResults(),
    ...overrides,
  };
}

describe("governed-ai deployment_id validation", () => {
  it("accepts valid numeric deployment id", () => {
    expect(validateDeploymentId("6064462333").ok).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["negative", "-1"],
    ["decimal", "1.5"],
    ["exponent", "1e3"],
    ["whitespace", " 6064462333"],
    ["letters", "606abc"],
    ["zero", "0"],
    ["leading zero", "06064462333"],
    ["excessive length", "1".repeat(20)],
  ])("rejects invalid deployment_id: %s", (_label, value) => {
    expect(validateDeploymentId(value).ok).toBe(false);
  });
});

describe("governed-ai deployment provenance", () => {
  it("accepts trusted Vercel deployment metadata", () => {
    expect(validateDeploymentProvenance(trustedDeployment()).ok).toBe(true);
  });

  it("rejects wrong task", () => {
    expect(validateDeploymentProvenance(trustedDeployment({ task: "deploy:production" })).ok).toBe(false);
  });

  it("records exact-bot fallback when GitHub App metadata is absent", () => {
    const deployment = trustedDeployment({ performed_via_github_app: null });
    expect(resolveProvenanceMethod(deployment)).toBe("exact_bot_identity_fallback");
    const result = bind(TRUSTED_PREVIEW_URL, deployment);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.evidence.observed_deployment_github_app_id).toBeNull();
      expect(result.evidence.deployment_provenance_method).toBe("exact_bot_identity_fallback");
      expect(result.evidence.status_provenance_method).toBe("exact_bot_identity_fallback");
    }
  });
});

describe("governed-ai status provenance", () => {
  it("accepts trusted Vercel latest status", () => {
    expect(validateStatusProvenance(trustedStatus()).ok).toBe(true);
  });

  it("rejects status from another user", () => {
    expect(
      validateStatusProvenance(
        trustedStatus({ creator: { login: "evil-user", id: 1, type: "User" } }),
      ).ok,
    ).toBe(false);
  });

  it("rejects matching login with wrong immutable bot id", () => {
    expect(
      validateStatusProvenance(trustedStatus({ creator: { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: 1, type: "Bot" } }))
        .ok,
    ).toBe(false);
  });

  it("rejects matching id with wrong login", () => {
    expect(
      validateStatusProvenance(
        trustedStatus({ creator: { login: "fake[bot]", id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" } }),
      ).ok,
    ).toBe(false);
  });

  it("rejects wrong GitHub App id when app metadata is present", () => {
    expect(
      validateStatusProvenance(
        trustedStatus({ performed_via_github_app: { id: 9999, slug: "vercel" } }),
      ).ok,
    ).toBe(false);
  });

  it("accepts documented bot fallback when app metadata is absent", () => {
    expect(validateStatusProvenance(trustedStatus({ performed_via_github_app: null })).ok).toBe(true);
  });
});

describe("governed-ai latest status selection", () => {
  it("selects newest status by created_at then numeric id tie-break", () => {
    const statuses = [
      trustedStatus({ id: 1, created_at: "2026-08-24T14:00:00Z", state: "success" }),
      trustedStatus({ id: 3, created_at: "2026-08-24T15:00:00Z", state: "failure" }),
      trustedStatus({ id: 2, created_at: "2026-08-24T15:00:00Z", state: "pending" }),
    ];
    expect(selectLatestDeploymentStatus(statuses)?.id).toBe(3);
  });

  it("uses numeric id tie-break for same timestamp", () => {
    const a = trustedStatus({ id: 10, created_at: "2026-08-24T14:00:00Z" });
    const b = trustedStatus({ id: 20, created_at: "2026-08-24T14:00:00Z" });
    expect(compareLatestDeploymentStatus(a, b)).toBeGreaterThan(0);
    expect(selectLatestDeploymentStatus([a, b])?.id).toBe(20);
  });

  it("rejects latest failure after older success", () => {
    const statuses = [
      trustedStatus({ id: 1, created_at: "2026-08-24T14:00:00Z", state: "success" }),
      trustedStatus({ id: 2, created_at: "2026-08-24T15:00:00Z", state: "failure" }),
    ];
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), statuses).ok).toBe(false);
  });

  it("rejects latest pending after older success", () => {
    const statuses = [
      trustedStatus({ id: 1, created_at: "2026-08-24T14:00:00Z", state: "success" }),
      trustedStatus({ id: 2, created_at: "2026-08-24T15:00:00Z", state: "pending" }),
    ];
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), statuses).ok).toBe(false);
  });

  it("rejects truncated pagination", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), [trustedStatus()], false).ok).toBe(false);
  });

  it("rejects missing statuses", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), []).ok).toBe(false);
  });
});

describe("governed-ai deployment binding", () => {
  it("accepts trusted Vercel Preview deployment with matching URL", () => {
    const result = bind();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalPreviewUrl).toBe(TRUSTED_PREVIEW_URL);
      expect(result.evidence.latest_status_id).toBe(17234886426);
      expect(result.evidence.status_creator_login).toBe(VERCEL_DEPLOYMENT_BOT_LOGIN);
    }
  });

  it("rejects wrong deployment SHA", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment({ sha: "a".repeat(40) })).ok).toBe(false);
  });

  it("rejects different deployment URL than operator input", () => {
    expect(bind(OLD_STATIC_HOST).ok).toBe(false);
  });

  it.each(["error", "failure", "inactive", "queued", "pending", "in_progress"])(
    "rejects non-success latest state: %s",
    (state) => {
      expect(validateLatestStatusState(state).ok).toBe(false);
    },
  );
});

describe("governed-ai preview URL validation", () => {
  it("accepts exact trusted deployment URL", () => {
    expect(validatePreviewUrlMatchesTrusted(TRUSTED_PREVIEW_URL, TRUSTED_PREVIEW_URL).ok).toBe(true);
  });

  it.each([
    ["attacker-owned vercel.app", "https://totally-unrelated.vercel.app"],
    ["lookalike team suffix", "https://aistroyka-web-web-v7jq-8of2zsc02-evil.vercel.app"],
    ["http protocol", `http://${GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX}abc${GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX}`],
  ])("rejects unsafe preview URL: %s", (_label, url) => {
    expect(normalizePreviewOrigin(url).ok).toBe(false);
  });
});

describe("governed-ai 25-step verdict contract", () => {
  const context = { trustedCanonicalOrigin: TRUSTED_PREVIEW_URL, targetSha: TARGET_SHA };

  it("accepts exact 25 steps all PASS with matching base and sha7", () => {
    expect(validateE2eSuccessContract(0, provenPayload(), context).ok).toBe(true);
  });

  it("rejects 24 PASS steps", () => {
    const results = allPassResults().slice(0, 24);
    expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
  });

  it("rejects missing step 23", () => {
    const results = allPassResults().filter((entry) => entry.step !== 23);
    expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
  });

  it("rejects duplicate step", () => {
    const results = allPassResults();
    results.push({ step: 23, status: GOVERNED_AI_E2E_ALLOWED_STEP_STATUS });
    expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
  });

  it("rejects steps 0-24 only", () => {
    const results = Array.from({ length: 25 }, (_, index) => ({
      step: index,
      status: GOVERNED_AI_E2E_ALLOWED_STEP_STATUS,
    }));
    expect(validateE2eStepResults(results).ok).toBe(false);
  });

  it("rejects extra step 26", () => {
    const results = [...allPassResults(), { step: 26, status: GOVERNED_AI_E2E_ALLOWED_STEP_STATUS }];
    expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
  });

  it.each(["BLOCKED_EXTERNAL", "PARTIAL", "FAILED", "SKIPPED", "NOT_RUN"])(
    "rejects rejected step status: %s",
    (status) => {
      const results = allPassResults();
      results[22] = { step: 23, status };
      expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
    },
  );

  it("rejects unknown step status", () => {
    const results = allPassResults();
    results[0] = { step: 1, status: "MAYBE" };
    expect(validateE2eSuccessContract(0, provenPayload({ results }), context).ok).toBe(false);
  });

  it("rejects PROVEN with top-level error", () => {
    expect(validateE2eSuccessContract(0, provenPayload({ error: "boom" }), context).ok).toBe(false);
  });

  it("rejects wrong base URL", () => {
    expect(
      validateE2eSuccessContract(0, provenPayload({ base: OLD_STATIC_HOST }), context).ok,
    ).toBe(false);
  });

  it("rejects wrong deployedSha7", () => {
    expect(
      validateE2eSuccessContract(0, provenPayload({ deployedSha7: "0000000" }), context).ok,
    ).toBe(false);
  });

  it("rejects exit nonzero with otherwise valid result", () => {
    expect(validateE2eSuccessContract(2, provenPayload(), context).ok).toBe(false);
  });

  it("rejects exit 0 with PASS verdict", () => {
    expect(validateE2eSuccessContract(0, provenPayload({ verdict: "PASS" }), context).ok).toBe(false);
  });

  it("rejects malformed JSON root", () => {
    expect(validateE2eStructuredOutput(null, context).ok).toBe(false);
  });
});

describe("governed-ai-pr-e2e staging environment protection", () => {
  it("allows protected staging environment", () => {
    const result = evaluateStagingEnvironmentProtection({
      name: "staging",
      protection_rules: [{ type: "required_reviewers", prevent_self_review: true }],
      deployment_branch_policy: { custom_branch_policies: true },
      deployment_branch_policies: [{ name: "main" }],
    });
    expect(result.ok).toBe(true);
  });
});

describe("governed-ai-pr-e2e staging Supabase origin", () => {
  it("accepts the exact AISTROYKA staging origin", () => {
    expect(validateStagingSupabaseOrigin(GOVERNED_AI_STAGING_SUPABASE_ORIGIN).ok).toBe(true);
  });
});

describe("governed-ai-pr-e2e-runner workflow contract", () => {
  it("requires deployment_id and latest_status_id outputs", () => {
    expect(wf).toMatch(/deployment_id:/);
    expect(wf).toMatch(/latest_status_id: \$\{\{ steps\.export\.outputs\.latest_status_id \}\}/);
  });

  it("job1 has no staging environment or secrets", () => {
    const job1 = wf.split("trust-boundary-preflight:")[1].split("governed-ai-pr-e2e:")[0];
    expect(job1).not.toMatch(/environment:\s*staging/);
    expect(job1).not.toMatch(/secrets\./);
  });

  it("post-approval step revalidates status creator and state before PR checkout", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1].split("governed-ai-pr-e2e-postprocess:")[0];
    expect(job2).toMatch(/Latest deployment status drifted/);
    expect(job2).toMatch(/status_creator_login/);
    const revalidateIdx = job2.indexOf("Revalidate PR head and deployment binding after environment approval");
    const checkoutPrIdx = job2.indexOf("Checkout verified PR head");
    expect(checkoutPrIdx).toBeGreaterThan(revalidateIdx);
  });

  it("isolates trusted redaction and verdict in a separate postprocess job", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1].split("governed-ai-pr-e2e-postprocess:")[0];
    const job3 = wf.split("governed-ai-pr-e2e-postprocess:")[1].split("governed-ai-pr-e2e-verdict:")[0];
    expect(job2).not.toMatch(/Redact E2E evidence/);
    expect(job2).not.toMatch(/Report redacted verdict only/);
    expect(job2).toMatch(/Stage raw E2E output for isolated postprocess job/);
    expect(job2).toMatch(/actions\/cache\/save/);
    expect(job2).toMatch(/Record validated E2E exit code/);
    expect(job2).not.toMatch(/upload-artifact/);
    expect(job2).not.toMatch(/chmod -R a-w trusted-runner-ops/);
    expect(job3).toMatch(/name: Governed AI PR E2E postprocess/);
    expect(job3).toMatch(/actions\/cache\/restore/);
    expect(job3).toMatch(/fail-on-cache-miss: true/);
    expect(job3).toMatch(/Verify trusted runner ops integrity/);
    expect(job3).toMatch(/GOVERNED_AI_E2E_REQUIRED_STEP_COUNT = 25/);
    expect(job3).toMatch(/Redact E2E evidence/);
    expect(job3).toMatch(/E2E_EXIT_CODE:/);
    expect(job3).toMatch(/Invalid E2E exit code from upstream job/);
    expect(job3).toMatch(/Report redacted verdict only/);
    expect(job3).toMatch(/environment:\s*staging/);
    const e2eIdx = job2.indexOf("Run governed AI staging E2E (raw output file only)");
    const rawStageIdx = job2.indexOf("Stage raw E2E output for isolated postprocess job");
    const redactIdx = job3.indexOf("Redact E2E evidence");
    const verdictIdx = job3.indexOf("Report redacted verdict only");
    expect(rawStageIdx).toBeGreaterThan(e2eIdx);
    expect(redactIdx).toBeGreaterThan(0);
    expect(verdictIdx).toBeGreaterThan(redactIdx);
  });

  it("verdict job fails closed when postprocess is skipped or failed", () => {
    const verdictJob = wf.split("governed-ai-pr-e2e-verdict:")[1];
    expect(verdictJob).toMatch(/governed-ai-pr-e2e-postprocess/);
    expect(verdictJob).toMatch(/Trusted E2E postprocess job was skipped/);
    expect(verdictJob).toMatch(/Governed AI E2E postprocess job failed/);
  });

  it("requires 25-step PROVEN verdict with trusted origin and target sha", () => {
    expect(wf).toMatch(/TRUSTED_CANONICAL_ORIGIN/);
    expect(wf).toMatch(/TARGET_SHA/);
    expect(wf).toMatch(/25\/25 PASS required/);
    expect(constantsSource).not.toMatch(/GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME/);
  });
});

describe("governed-ai-pr-e2e redaction helper", () => {
  it("redacts signed URLs from evidence", async () => {
    const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "gov-e2e-redact-"));
    writeFileSync(join(dir, "e2e-result.json"), JSON.stringify(provenPayload()));
    execFileSync("bun", [resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.redact-e2e-result.mjs")], {
      cwd: dir,
      stdio: "pipe",
    });
    const redacted = JSON.parse(readFileSync(join(dir, "e2e-result-redacted.json"), "utf8"));
    expect(redacted.verdict).toBe(GOVERNED_AI_E2E_SUCCESS_VERDICT);
    rmSync(dir, { recursive: true, force: true });
  });

  it("injects trusted base and deployedSha7 after redacting harness output", async () => {
    const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "gov-e2e-redact-contract-"));
    writeFileSync(
      join(dir, "e2e-result.json"),
      JSON.stringify({
        ...provenPayload(),
        base: `${TRUSTED_PREVIEW_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig`,
        detail: `visited ${TRUSTED_PREVIEW_URL}/dashboard`,
        nested: { base: `${TRUSTED_PREVIEW_URL}/evil` },
      }),
    );
    execFileSync("bun", [resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.redact-e2e-result.mjs")], {
      cwd: dir,
      stdio: "pipe",
      env: {
        ...process.env,
        TRUSTED_CANONICAL_ORIGIN: TRUSTED_PREVIEW_URL,
        TARGET_SHA,
      },
    });
    const redacted = JSON.parse(readFileSync(join(dir, "e2e-result-redacted.json"), "utf8"));
    expect(redacted.base).toBe(TRUSTED_PREVIEW_URL);
    expect(redacted.deployedSha7).toBe(TARGET_SHA.slice(0, 7));
    expect(redacted.detail).toContain("[redacted-url]");
    expect(redacted.nested.base).toContain("[redacted-url]");
    const verdict = validateE2eSuccessContract(0, redacted, {
      trustedCanonicalOrigin: TRUSTED_PREVIEW_URL,
      targetSha: TARGET_SHA,
    });
    expect(verdict.ok).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("redacts malicious JWT content in harness verdict before artifact upload", async () => {
    const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "gov-e2e-redact-verdict-"));
    const maliciousVerdict = `PROVEN eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig`;
    writeFileSync(join(dir, "e2e-result.json"), JSON.stringify({ ...provenPayload(), verdict: maliciousVerdict }));
    execFileSync("bun", [resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.redact-e2e-result.mjs")], {
      cwd: dir,
      stdio: "pipe",
      env: {
        ...process.env,
        TRUSTED_CANONICAL_ORIGIN: TRUSTED_PREVIEW_URL,
        TARGET_SHA,
      },
    });
    const redacted = JSON.parse(readFileSync(join(dir, "e2e-result-redacted.json"), "utf8"));
    expect(redacted.verdict).toContain("[redacted-jwt]");
    expect(redacted.verdict).not.toContain("eyJ");
    rmSync(dir, { recursive: true, force: true });
  });
});
