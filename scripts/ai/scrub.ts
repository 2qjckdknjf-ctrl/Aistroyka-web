#!/usr/bin/env bun
/**
 * PII scrub CLI — ops/dev use. Reads stdin or file path arg.
 * Usage: bun scripts/ai/scrub.ts [file]
 */

import { scrubText } from "../../apps/web/lib/platform/ai-flywheel/pii-scrub";

async function main(): Promise<void> {
  const path = process.argv[2];
  let input: string;
  if (path) {
    input = await Bun.file(path).text();
  } else {
    input = await Bun.stdin.text();
  }
  const result = scrubText(input);
  process.stdout.write(result.text);
  if (result.scrubbed) {
    process.stderr.write(`scrubbed types: ${result.typesFound.join(", ")}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
