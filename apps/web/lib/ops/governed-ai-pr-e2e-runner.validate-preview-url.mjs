#!/usr/bin/env bun
import {
  validatePreviewBaseUrl,
} from "./governed-ai-pr-e2e-runner.constants.ts";

const input = process.argv[2];
if (!input) {
  console.error("usage: validate-preview-url.mjs <preview_base_url>");
  process.exit(1);
}

const result = validatePreviewBaseUrl(input);
if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}

process.stdout.write(result.canonicalBaseUrl);
