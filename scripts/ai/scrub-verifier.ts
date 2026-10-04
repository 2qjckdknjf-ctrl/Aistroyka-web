#!/usr/bin/env bun
/**
 * PII scrub verifier CLI — exit 1 if unsanitized PII detected.
 * Usage: bun scripts/ai/scrub-verifier.ts [file]
 */

import { verifyScrubbedText } from "../../apps/web/lib/platform/ai-flywheel/pii-scrub-verifier";

async function main(): Promise<void> {
  const path = process.argv[2];
  let input: string;
  if (path) {
    input = await Bun.file(path).text();
  } else {
    input = await Bun.stdin.text();
  }
  const result = verifyScrubbedText(input);
  if (!result.passed) {
    process.stderr.write(`FAIL: violations: ${result.violations.join(", ")}\n`);
    process.exit(1);
  }
  process.stdout.write("PASS\n");
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
