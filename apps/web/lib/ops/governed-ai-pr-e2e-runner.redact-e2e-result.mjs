#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const rawPath = "e2e-result.json";
const redactedPath = "e2e-result-redacted.json";

function writeFailure(error) {
  writeFileSync(redactedPath, JSON.stringify({ verdict: "FAILED", error }, null, 2));
}

if (!existsSync(rawPath)) {
  writeFailure("no e2e output");
  process.exit(0);
}

let raw;
try {
  raw = JSON.parse(readFileSync(rawPath, "utf8"));
} catch {
  writeFailure("invalid e2e json");
  process.exit(0);
}

const redacted = {
  verdict: raw.verdict,
  base: raw.base,
  startedAt: raw.startedAt,
  deployedSha7: raw.deployedSha7,
  cleanup: raw.cleanup,
  results: (raw.results ?? []).map((r) => ({
    step: r.step,
    persona: r.persona,
    action: r.action,
    expected: r.expected,
    actual: r.actual,
    status: r.status,
    evidence:
      typeof r.evidence === "string"
        ? r.evidence.replace(/https?:\/\/\S+/g, "[redacted-url]")
        : r.evidence,
  })),
};

writeFileSync(redactedPath, JSON.stringify(redacted, null, 2));
