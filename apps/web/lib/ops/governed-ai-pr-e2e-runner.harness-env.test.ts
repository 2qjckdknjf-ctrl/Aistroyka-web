import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV,
  GOVERNED_AI_E2E_SAFE_SHELL_ENV,
  GOVERNED_AI_E2E_TRUSTED_PATH,
} from "./governed-ai-pr-e2e-runner.harness-env";

const root = resolve(__dirname, "../../../../");
const wf = readFileSync(resolve(root, ".github/workflows/governed-ai-pr-e2e-runner.yml"), "utf8");
const runHarness = readFileSync(
  resolve(root, "apps/web/lib/ops/governed-ai-pr-e2e-runner.run-harness.mjs"),
  "utf8",
);

describe("governed-ai harness environment isolation", () => {
  it("allowlists only E2E variables for harness subprocess", () => {
    expect(GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV).not.toContain("GITHUB_TOKEN");
    expect(GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV).not.toContain("ACTIONS_RUNTIME_TOKEN");
    expect(GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV).not.toContain("GITHUB_ENV");
    expect(GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV).not.toContain("NODE_OPTIONS");
    expect(GOVERNED_AI_E2E_HARNESS_ALLOWED_ENV).toContain("GOVERNED_E2E_BASE_URL");
  });

  it("clears shell startup poisoning vectors in safe shell env", () => {
    expect(GOVERNED_AI_E2E_SAFE_SHELL_ENV.BASH_ENV).toBe("/dev/null");
    expect(GOVERNED_AI_E2E_SAFE_SHELL_ENV.ENV).toBe("/dev/null");
    expect(GOVERNED_AI_E2E_SAFE_SHELL_ENV.NODE_OPTIONS).toBe("");
    expect(GOVERNED_AI_E2E_SAFE_SHELL_ENV.BUN_OPTIONS).toBe("");
    expect(GOVERNED_AI_E2E_SAFE_SHELL_ENV.GLOBIGNORE).toBe("*");
  });

  it("run-harness uses fixed node path and disables shell", () => {
    expect(runHarness).toMatch(/\/usr\/bin\/node/);
    expect(runHarness).toMatch(/shell: false/);
    expect(runHarness).not.toMatch(/GITHUB_/);
    expect(runHarness).toMatch(/GOVERNED_AI_E2E_SAFE_SHELL_ENV/);
  });

  it("workflow resets BASH_ENV ENV PATH and NODE_OPTIONS after harness", () => {
    const harness = wf.split("governed-ai-pr-e2e-harness:")[1].split("governed-ai-pr-e2e-seal:")[0];
    const reset = harness.split("Reset trusted runner shell environment after PR harness")[1]?.split(
      "Record validated E2E exit code",
    )[0];
    expect(reset).toContain("BASH_ENV=/dev/null");
    expect(reset).toContain("ENV=/dev/null");
    expect(reset).toMatch(/NODE_OPTIONS=/);
    expect(reset).toMatch(/GLOBIGNORE=\*/);
    expect(reset).toContain(`PATH=${GOVERNED_AI_E2E_TRUSTED_PATH}`);
  });

  it("workflow launches harness through env -i with safe BASH_ENV before subprocess", () => {
    const harness = wf.split("governed-ai-pr-e2e-harness:")[1].split("governed-ai-pr-e2e-seal:")[0];
    const e2eStep = harness.split("Run governed AI staging E2E (sanitized harness subprocess)")[1]?.split(
      "Reset trusted runner shell environment",
    )[0];
    expect(e2eStep).toMatch(/\/usr\/bin\/env -i/);
    expect(e2eStep).toContain("BASH_ENV=/dev/null");
    expect(e2eStep).toContain("ENV=/dev/null");
    expect(e2eStep).not.toMatch(/ACTIONS_RUNTIME_TOKEN/);
    expect(e2eStep).not.toMatch(/GITHUB_ENV/);
  });
});
