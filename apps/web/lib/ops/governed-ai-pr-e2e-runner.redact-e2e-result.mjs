#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const rawPath = "e2e-result.json";
const redactedPath = "e2e-result-redacted.json";

const SENSITIVE_KEY =
  /(?:password|secret|token|api[_-]?key|bypass|authorization|anon[_-]?key|credential)/i;

function redactString(value, key = "") {
  if (SENSITIVE_KEY.test(key)) {
    return "[redacted-secret]";
  }
  let out = value.replace(/https?:\/\/\S+/g, "[redacted-url]");
  out = out.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-jwt]");
  out = out.replace(/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+\b/g, "[redacted-token]");
  return out;
}

function redactValue(value, key = "") {
  if (typeof value === "string") {
    return redactString(value, key);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([nestedKey, nested]) => [nestedKey, redactValue(nested, nestedKey)]));
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
