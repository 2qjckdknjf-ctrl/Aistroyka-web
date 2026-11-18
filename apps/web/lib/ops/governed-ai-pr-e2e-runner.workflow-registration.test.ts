import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../../");
const workflow = readFileSync(
  resolve(root, ".github/workflows/governed-ai-pr-e2e-runner.yml"),
  "utf8"
);

describe("governed AI runner workflow registration", () => {
  it("remains manual-only", () => {
    expect(workflow).toContain("on:\n  workflow_dispatch:");
    expect(workflow).not.toMatch(/\non:\s*\n\s+push:/);
    expect(workflow).not.toMatch(/\n\s+pull_request:/);
  });

  it("does not contain the invalid quoted run scalar that made GitHub create zero-job failures", () => {
    expect(workflow).not.toContain(
      'run: "${{ steps.pin_bun.outputs.bun_path }}" trusted-runner-ops/'
    );
  });

  it("uses a block scalar for the seal private-key preflight command", () => {
    expect(workflow).toContain(
      '- name: Seal private key preflight\n        env:'
    );
    expect(workflow).toContain(
      '        run: |\n          "${{ steps.pin_bun.outputs.bun_path }}" trusted-runner-ops/apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-preflight.mjs'
    );
  });

  it("preserves the six-job fail-closed architecture", () => {
    for (const job of [
      "trust-boundary-preflight:",
      "governed-ai-pr-e2e-staging-gate:",
      "governed-ai-pr-e2e-harness:",
      "governed-ai-pr-e2e-seal:",
      "governed-ai-pr-e2e-postprocess:",
      "governed-ai-pr-e2e-verdict:",
    ]) {
      expect(workflow).toContain(`  ${job}`);
    }
  });
});
