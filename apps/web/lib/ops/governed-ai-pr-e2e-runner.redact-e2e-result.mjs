#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const rawPath = "e2e-result.json";
const redactedPath = "e2e-result-redacted.json";

function redactString(value) {
  return value.replace(/https?:\/\/\S+/g, "[redacted-url]");
}

function redactValue(value) {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, redactValue(nested)]));
  }
  return value;
}

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

const redacted = redactValue(raw);
writeFileSync(redactedPath, JSON.stringify(redacted, null, 2));
