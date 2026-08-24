import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../../");
const wf = readFileSync(resolve(root, ".github/workflows/governed-ai-pr-e2e-runner.yml"), "utf8");

describe("governed-ai-pr-e2e-runner workflow contract", () => {
  it("uses workflow_dispatch only and two-job architecture", () => {
    expect(wf).toMatch(/on:\s*\n\s*workflow_dispatch:/);
    expect(wf).toMatch(/trust-boundary-preflight:/);
    expect(wf).toMatch(/governed-ai-pr-e2e:/);
    expect(wf).toMatch(/needs:\s*trust-boundary-preflight/);
    expect(wf).not.toMatch(/pull_request_target/);
  });

  it("job1 has no staging environment or secrets", () => {
    const job1 = wf.split("trust-boundary-preflight:")[1].split("governed-ai-pr-e2e:")[0];
    expect(job1).not.toMatch(/environment:\s*staging/);
    expect(job1).not.toMatch(/secrets\./);
    expect(job1).not.toMatch(/vars\./);
  });

  it("job2 uses staging environment only after preflight", () => {
    const job2 = wf.split("governed-ai-pr-e2e:")[1];
    expect(job2).toMatch(/environment:\s*staging/);
    expect(job2).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(job2).not.toMatch(/contents:\s*write|pull-requests:\s*write|deployments:\s*write/);
  });

  it("rejects fork, validates SHA format, confirmation, and preview host", () => {
    expect(wf).toMatch(/Fork PRs are not allowed/);
    expect(wf).toMatch(/target_sha must be exactly 40 lowercase hex/);
    expect(wf).toMatch(/RUN_GOVERNED_AI_STAGING_E2E/);
    expect(wf).toMatch(/aistroyka-web-web-v7jq/);
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

  it("enforces default-branch dispatch only", () => {
    expect(wf).toMatch(/github\.ref.*refs\/heads\/main/);
    expect(wf).toMatch(/main branch definition/);
  });

  it("uploads redacted artifact only without logging raw E2E output", () => {
    expect(wf).toMatch(/e2e-result-redacted\.json/);
    expect(wf).toMatch(/redacted-url/);
    expect(wf).not.toMatch(/\|\s*tee e2e-result\.json/);
    expect(wf).toMatch(/> e2e-result\.json 2>&1/);
  });

  it("checks out exact verified target SHA", () => {
    expect(wf).toMatch(/ref: \$\{\{ needs\.trust-boundary-preflight\.outputs\.target_sha \}\}/);
    expect(wf).toMatch(/git rev-parse HEAD/);
    expect(wf).toMatch(/governed-ai-owner-evidence-staging-e2e\.mjs/);
  });
});
