import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GOVERNED_AI_E2E_SUCCESS_VERDICT,
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
  normalizePreviewOrigin,
  selectLatestDeploymentStatus,
  validateDeploymentBinding,
  validateDeploymentId,
  validatePreviewUrlMatchesTrusted,
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

function trustedDeployment(overrides: Partial<GitHubDeploymentRecord> = {}): GitHubDeploymentRecord {
  return {
    id: Number(DEPLOYMENT_ID),
    sha: TARGET_SHA,
    environment: GOVERNED_AI_PREVIEW_ENVIRONMENT,
    repository_url: `https://api.github.com/repos/${GOVERNED_AI_REPOSITORY_FULL_NAME}`,
    creator: { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" },
    performed_via_github_app: null,
    ...overrides,
  };
}

function trustedStatuses(
  overrides: Partial<GitHubDeploymentStatusRecord> = {},
): GitHubDeploymentStatusRecord[] {
  return [
    {
      id: 17234886426,
      state: "success",
      environment: GOVERNED_AI_PREVIEW_ENVIRONMENT,
      environment_url: TRUSTED_PREVIEW_URL,
      target_url: TRUSTED_PREVIEW_URL,
      created_at: "2026-08-24T14:11:58Z",
      creator: { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" },
      performed_via_github_app: null,
      ...overrides,
    },
  ];
}

function bind(inputPreview = TRUSTED_PREVIEW_URL, deployment = trustedDeployment(), statuses = trustedStatuses()) {
  return validateDeploymentBinding({
    repositoryFullName: GOVERNED_AI_REPOSITORY_FULL_NAME,
    targetSha: TARGET_SHA,
    deploymentId: DEPLOYMENT_ID,
    inputPreviewUrl: inputPreview,
    deployment,
    statuses,
  });
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

describe("governed-ai deployment binding", () => {
  it("accepts trusted Vercel Preview deployment with matching URL", () => {
    const result = bind();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalPreviewUrl).toBe(TRUSTED_PREVIEW_URL);
      expect(result.evidence.deployment_id).toBe(DEPLOYMENT_ID);
    }
  });

  it("rejects wrong deployment SHA", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment({ sha: "a".repeat(40) })).ok).toBe(false);
  });

  it("rejects wrong repository", () => {
    expect(
      bind(
        TRUSTED_PREVIEW_URL,
        trustedDeployment({
          repository_url: "https://api.github.com/repos/evil/evil",
        }),
      ).ok,
    ).toBe(false);
  });

  it("rejects wrong environment", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment({ environment: "Production" })).ok).toBe(false);
  });

  it("rejects non-success latest status", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), trustedStatuses({ state: "failure" })).ok).toBe(false);
  });

  it("rejects missing statuses", () => {
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), []).ok).toBe(false);
  });

  it("rejects untrusted GitHub App creator", () => {
    expect(
      bind(
        TRUSTED_PREVIEW_URL,
        trustedDeployment({
          creator: { login: "evil[bot]", id: 1, type: "Bot" },
          performed_via_github_app: null,
        }),
      ).ok,
    ).toBe(false);
  });

  it("accepts trusted GitHub App identity when creator metadata uses performed_via_github_app", () => {
    expect(
      bind(
        TRUSTED_PREVIEW_URL,
        trustedDeployment({
          creator: undefined,
          performed_via_github_app: { id: VERCEL_GITHUB_APP_ID, slug: "vercel" },
        }),
        trustedStatuses({
          creator: undefined,
          performed_via_github_app: { id: VERCEL_GITHUB_APP_ID, slug: "vercel" },
        }),
      ).ok,
    ).toBe(true);
  });

  it("rejects stale success when latest status failed", () => {
    const statuses: GitHubDeploymentStatusRecord[] = [
      {
        id: 2,
        state: "failure",
        environment_url: TRUSTED_PREVIEW_URL,
        created_at: "2026-08-24T15:00:00Z",
        creator: { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" },
      },
      {
        id: 1,
        state: "success",
        environment_url: TRUSTED_PREVIEW_URL,
        created_at: "2026-08-24T14:00:00Z",
        creator: { login: VERCEL_DEPLOYMENT_BOT_LOGIN, id: VERCEL_DEPLOYMENT_BOT_ID, type: "Bot" },
      },
    ];
    expect(selectLatestDeploymentStatus(statuses)?.state).toBe("failure");
    expect(bind(TRUSTED_PREVIEW_URL, trustedDeployment(), statuses).ok).toBe(false);
  });

  it("rejects different deployment URL than operator input", () => {
    expect(bind(OLD_STATIC_HOST).ok).toBe(false);
  });
});

describe("governed-ai preview URL validation", () => {
  it("accepts exact trusted deployment URL", () => {
    const trusted = normalizePreviewOrigin(TRUSTED_PREVIEW_URL);
    expect(trusted.ok).toBe(true);
    if (trusted.ok) {
      expect(validatePreviewUrlMatchesTrusted(trusted.value.origin, TRUSTED_PREVIEW_URL).ok).toBe(true);
    }
  });

  it("rejects old static hostname when it is not the trusted deployment URL", () => {
    expect(bind(OLD_STATIC_HOST).ok).toBe(false);
  });

  it.each([
    ["attacker-owned vercel.app", "https://totally-unrelated.vercel.app"],
    ["lookalike team suffix", "https://aistroyka-web-web-v7jq-8of2zsc02-evil.vercel.app"],
    ["http protocol", `http://${GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX}abc${GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX}`],
    ["userinfo", `https://user:pass@${GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX}abc${GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX}`],
    ["custom port", `${TRUSTED_PREVIEW_URL}:8443`],
    ["path suffix", `${TRUSTED_PREVIEW_URL}/api`],
    ["query bypass", `${TRUSTED_PREVIEW_URL}?token=abc`],
    ["fragment", `${TRUSTED_PREVIEW_URL}#frag`],
    ["trailing dot", `https://${GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX}abc${GOVERNED_AI_VERCEL_TEAM_HOSTNAME_SUFFIX}.`],
  ])("rejects unsafe preview URL: %s", (_label, url) => {
    expect(normalizePreviewOrigin(url).ok).toBe(false);
  });
});

describe("governed-ai E2E verdict contract", () => {
  const provenPayload = {
    verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT,
    base: TRUSTED_PREVIEW_URL,
    results: [{ step: 1, status: "PASS" }],
  };

  it("accepts exit 0 with exact PROVEN verdict", () => {
    expect(validateE2eSuccessContract(0, provenPayload).ok).toBe(true);
  });

  it("rejects exit 0 with PASS verdict", () => {
    expect(validateE2eSuccessContract(0, { ...provenPayload, verdict: "PASS" }).ok).toBe(false);
  });

  it.each(["PARTIAL", "READY", "SUCCESS", "PROVEN_WITH_WARNINGS"])(
    "rejects lookalike verdict: %s",
    (verdict) => {
      expect(validateE2eSuccessContract(0, { ...provenPayload, verdict }).ok).toBe(false);
    },
  );

  it("rejects exit nonzero even with PROVEN verdict", () => {
    expect(validateE2eSuccessContract(2, provenPayload).ok).toBe(false);
  });

  it("rejects malformed JSON object", () => {
    expect(validateE2eStructuredOutput(null).ok).toBe(false);
  });

  it("rejects contradictory FAILED step with PROVEN verdict", () => {
    expect(
      validateE2eStructuredOutput({
        verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT,
        base: TRUSTED_PREVIEW_URL,
        results: [{ step: 1, status: "FAILED" }],
      }).ok,
    ).toBe(false);
  });
});

describe("governed-ai-pr-e2e staging environment protection", () => {
  it("blocks missing environment metadata", () => {
    expect(evaluateStagingEnvironmentProtection(null).ok).toBe(false);
  });

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
  it("uses workflow_dispatch only and three-job architecture", () => {
    expect(wf).toMatch(/on:\s*\n\s*workflow_dispatch:/);
    expect(wf).toMatch(/trust-boundary-preflight:/);
    expect(wf).toMatch(/governed-ai-pr-e2e:/);
    expect(wf).toMatch(/governed-ai-pr-e2e-verdict:/);
    expect(wf).not.toMatch(/pull_request_target/);
  });

  it("requires deployment_id dispatch input", () => {
    expect(wf).toMatch(/deployment_id:/);
    expect(wf).toMatch(/deployment_id must be a positive decimal integer/);
  });

  it("job1 has no staging environment or secrets", () => {
    const job1 = wf.split("trust-boundary-preflight:")[1].split("governed-ai-pr-e2e:")[0];
    expect(job1).not.toMatch(/environment:\s*staging/);
    expect(job1).not.toMatch(/secrets\./);
    expect(job1).not.toMatch(/vars\./);
  });

  it("job2 uses staging environment with deployment binding revalidation before PR checkout", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1].split("governed-ai-pr-e2e-verdict:")[0];
    expect(job2).toMatch(/environment:\s*staging/);
    expect(job2).toMatch(/validate-deployment-binding\.mjs/);
    const revalidateIdx = job2.indexOf("Revalidate PR head and deployment binding after environment approval");
    const checkoutPrIdx = job2.indexOf("Checkout verified PR head");
    expect(revalidateIdx).toBeGreaterThan(-1);
    expect(checkoutPrIdx).toBeGreaterThan(revalidateIdx);
  });

  it("uses GitHub deployment binding validator instead of static hostname allowlist", () => {
    expect(wf).toMatch(/validate-deployment-binding\.mjs/);
    expect(wf).not.toMatch(/validate-preview-url\.mjs/);
    expect(constantsSource).not.toMatch(/GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME/);
    expect(constantsSource).toMatch(/GOVERNED_AI_VERCEL_PROJECT_HOSTNAME_PREFIX/);
  });

  it("requires exact PROVEN verdict via trusted validator", () => {
    expect(wf).toMatch(/validate-e2e-verdict\.mjs/);
    expect(wf).not.toMatch(/Governed AI E2E verdict is not PASS/);
  });

  it("job2 revalidates PR head with pull-requests read before PR checkout", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1].split("governed-ai-pr-e2e-verdict:")[0];
    expect(job2).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(job2).toMatch(/pull-requests:\s*read/);
    expect(job2).toMatch(/deployments:\s*read/);
  });

  it("keeps secret containment and ignore-scripts install", () => {
    expect(wf).toMatch(/bun install --frozen-lockfile --ignore-scripts/);
    expect(wf).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(wf).toMatch(/> e2e-result\.json 2> e2e-result\.stderr/);
    expect(wf).toMatch(/rm -f e2e-result\.json e2e-result\.stderr/);
    expect(wf).toMatch(/if: always\(\) && steps\.redact\.outcome == 'success'/);
  });

  it("queues concurrent runs and pins trusted helper checkout to github.sha", () => {
    expect(wf).toMatch(/cancel-in-progress:\s*false/);
    expect(wf).toMatch(/ref: \$\{\{ github\.sha \}\}/);
  });
});

describe("governed-ai-pr-e2e redaction helper", () => {
  it("redacts signed URLs from evidence", async () => {
    const { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const dir = mkdtempSync(join(tmpdir(), "gov-e2e-redact-"));
    const raw = {
      verdict: GOVERNED_AI_E2E_SUCCESS_VERDICT,
      cleanup: "see https://example.com/cleanup?sig=abc",
      debug: {
        password: "super-secret-password",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      },
      results: [
        {
          step: "login",
          actual: "redirect https://example.com/token?sig=abc",
          expected: "ok",
          evidence: "see https://example.com/secret?sig=abc",
          message: "failed with injected-bypass-token-value leak",
        },
      ],
    };
    writeFileSync(join(dir, "e2e-result.json"), JSON.stringify(raw));
    execFileSync(
      "bun",
      [resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.redact-e2e-result.mjs")],
      {
        cwd: dir,
        stdio: "pipe",
        env: {
          ...process.env,
          REDACT_WORKER_PASS: "injected-worker-password-value",
          REDACT_VERCEL_BYPASS: "injected-bypass-token-value",
        },
      },
    );
    const redacted = JSON.parse(readFileSync(join(dir, "e2e-result-redacted.json"), "utf8"));
    expect(redacted.cleanup).toBe("see [redacted-url]");
    expect(redacted.debug.password).toBe("[redacted-secret]");
    rmSync(dir, { recursive: true, force: true });
    expect(existsSync(dir)).toBe(false);
  });
});
