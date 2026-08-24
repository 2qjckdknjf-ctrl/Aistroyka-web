import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL,
  GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME,
  evaluateStagingEnvironmentProtection,
  validatePreviewBaseUrl,
} from "./governed-ai-pr-e2e-runner.constants";

const root = resolve(__dirname, "../../../../");
const wf = readFileSync(resolve(root, ".github/workflows/governed-ai-pr-e2e-runner.yml"), "utf8");
const constantsSource = readFileSync(
  resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.constants.ts"),
  "utf8",
);

describe("governed-ai-pr-e2e preview URL validation", () => {
  it("accepts the exact canonical hostname", () => {
    const result = validatePreviewBaseUrl(GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalBaseUrl).toBe(GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL);
    }
  });

  it.each([
    ["attacker prefix", `https://aistroyka-web-web-v7jq-phish.vercel.app`],
    ["allowed prefix on foreign slug", `https://aistroyka-web-web-v7jq.evil.vercel.app`],
    ["subdomain trick", `https://sub.${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}`],
    ["http protocol", `http://${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}`],
    ["custom port", `https://${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}:8443`],
    ["username/password", `https://user:pass@${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}`],
    ["query bypass", `${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL}?token=abc`],
    ["fragment", `${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL}#frag`],
    ["trailing dot", `https://${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME}.`],
    ["path suffix", `${GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_BASE_URL}/api`],
    ["arbitrary vercel.app", "https://totally-unrelated.vercel.app"],
  ])("rejects unsafe preview URL: %s", (_label, url) => {
    expect(validatePreviewBaseUrl(url).ok).toBe(false);
  });
});

describe("governed-ai-pr-e2e staging environment protection", () => {
  it("blocks missing environment metadata", () => {
    expect(evaluateStagingEnvironmentProtection(null).ok).toBe(false);
  });

  it("blocks empty protection rules", () => {
    const result = evaluateStagingEnvironmentProtection({
      name: "staging",
      protection_rules: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED");
    }
  });

  it("blocks environments without required reviewers", () => {
    const result = evaluateStagingEnvironmentProtection({
      name: "staging",
      protection_rules: [{ type: "wait_timer" }],
    });
    expect(result.ok).toBe(false);
  });

  it("allows protected staging environment", () => {
    const result = evaluateStagingEnvironmentProtection({
      name: "staging",
      protection_rules: [{ type: "required_reviewers" }],
    });
    expect(result.ok).toBe(true);
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

  it("job1 has no staging environment or secrets", () => {
    const job1 = wf.split("trust-boundary-preflight:")[1].split("governed-ai-pr-e2e:")[0];
    expect(job1).not.toMatch(/environment:\s*staging/);
    expect(job1).not.toMatch(/secrets\./);
    expect(job1).not.toMatch(/vars\./);
  });

  it("job2 uses staging environment with main guard and protected preflight output", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1].split("governed-ai-pr-e2e-verdict:")[0];
    expect(job2).toMatch(/environment:\s*staging/);
    expect(job2).toMatch(/github\.ref == 'refs\/heads\/main'/);
    expect(job2).toMatch(/staging_environment_protected == 'true'/);
    expect(job2).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(job2).not.toMatch(/contents:\s*write|pull-requests:\s*write|deployments:\s*write/);
  });

  it("uses trusted canonical preview URL output instead of raw input", () => {
    expect(wf).toMatch(/validate-preview-url\.mjs/);
    expect(wf).toMatch(/preview_base_url=\$\{CANONICAL_PREVIEW_URL\}/);
    expect(wf).not.toMatch(/aistroyka-web-web-v7jq\[a-z0-9-\]\*/);
    expect(wf).not.toMatch(/endsWith\("vercel\.app"\)/);
  });

  it("keeps canonical hostname in constants module used by validator", () => {
    expect(constantsSource).toContain(GOVERNED_AI_PR_E2E_CANONICAL_PREVIEW_HOSTNAME);
    expect(wf).toMatch(/validate-preview-url\.mjs/);
  });

  it("blocks unprotected staging environment before secret job", () => {
    expect(wf).toMatch(/BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED/);
    expect(wf).toMatch(/environments\/staging/);
    expect(wf).toMatch(/required_reviewers/);
  });

  it("rejects fork, validates SHA format, and confirmation", () => {
    expect(wf).toMatch(/Fork PRs are not allowed/);
    expect(wf).toMatch(/target_sha must be exactly 40 lowercase hex/);
    expect(wf).toMatch(/RUN_GOVERNED_AI_STAGING_E2E/);
    expect(wf).toMatch(/BLOCKED_VERCEL_BYPASS/);
    expect(wf).toMatch(/FAILED_DEPLOYMENT_ALIGNMENT/);
  });

  it("requires QA project variable and forbids service-role key", () => {
    expect(wf).toMatch(/vars\.PILOT_SMOKE_PROJECT_ID_STAGING/);
    expect(wf).toMatch(/PILOT_SMOKE_PROJECT_ID_STAGING must be a valid UUID/);
    expect(wf).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("pins third-party actions by immutable SHA", () => {
    expect(wf).toMatch(/actions\/checkout@[0-9a-f]{40}/);
    expect(wf).toMatch(/oven-sh\/setup-bun@[0-9a-f]{40}/);
    expect(wf).toMatch(/actions\/upload-artifact@[0-9a-f]{40}/);
    expect(wf).not.toMatch(/uses: actions\/checkout@v/);
  });

  it("contains raw E2E output without logging it and always redacts artifact", () => {
    expect(wf).toMatch(/e2e-result-redacted\.json/);
    expect(wf).toMatch(/redact-e2e-result\.mjs/);
    expect(wf).not.toMatch(/\|\s*tee e2e-result\.json/);
    expect(wf).toMatch(/> e2e-result\.json 2> e2e-result\.stderr/);
    expect(wf).toMatch(/rm -f e2e-result\.json e2e-result\.stderr/);
    expect(wf).not.toMatch(/path: e2e-result\.json/);
  });

  it("checks out exact verified target SHA in isolated workspace", () => {
    expect(wf).toMatch(/ref: \$\{\{ needs\.trust-boundary-preflight\.outputs\.target_sha \}\}/);
    expect(wf).toMatch(/git rev-parse HEAD/);
    expect(wf).toMatch(/governed-ai-owner-evidence-staging-e2e\.mjs/);
    expect(wf).toMatch(/path: pr-workspace/);
  });

  it("fails closed when secret-consuming job is skipped", () => {
    expect(wf).toMatch(/Secret-consuming E2E job was skipped/);
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
      verdict: "PASS",
      results: [{ evidence: "see https://example.com/secret?sig=abc" }],
    };
    writeFileSync(join(dir, "e2e-result.json"), JSON.stringify(raw));
    execFileSync(
      "bun",
      [resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.redact-e2e-result.mjs")],
      {
        cwd: dir,
        stdio: "pipe",
      },
    );
    const redacted = JSON.parse(readFileSync(join(dir, "e2e-result-redacted.json"), "utf8"));
    expect(redacted.results[0].evidence).toBe("see [redacted-url]");
    rmSync(dir, { recursive: true, force: true });
    expect(existsSync(dir)).toBe(false);
  });
});
