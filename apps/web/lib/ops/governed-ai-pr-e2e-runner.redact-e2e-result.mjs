#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const rawPath = "e2e-result.json";
const redactedPath = "e2e-result-redacted.json";

const SENSITIVE_KEY =
  /(?:password|secret|token|api[_-]?key|bypass|authorization|anon[_-]?key|credential)/i;

const KNOWN_SECRET_ENV_KEYS = [
  "REDACT_VERCEL_BYPASS",
  "REDACT_WORKER_PASS",
  "REDACT_MANAGER_PASS",
  "REDACT_OWNER_PASS",
  "REDACT_STAKEHOLDER_REVOKED_PASS",
  "REDACT_CROSS_TENANT_PASS",
  "REDACT_SUPABASE_ANON",
];

/** Top-level harness contract fields required for post-redaction verdict validation. */
const PRESERVED_CONTRACT_KEYS = new Set(["base", "deployedSha7", "verdict"]);

function collectKnownSecrets() {
  return KNOWN_SECRET_ENV_KEYS.map((key) => process.env[key])
    .filter((value) => typeof value === "string" && value.length >= 8)
    .sort((a, b) => b.length - a.length);
}

function scrubKnownSecrets(value, knownSecrets) {
  let out = value;
  for (const secret of knownSecrets) {
    if (out.includes(secret)) {
      out = out.split(secret).join("[redacted-secret]");
    }
  }
  return out;
}

function redactString(value, key = "", knownSecrets = []) {
  if (SENSITIVE_KEY.test(key)) {
    return "[redacted-secret]";
  }
  let out = value.replace(/https?:\/\/\S+/g, "[redacted-url]");
  out = out.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-jwt]");
  out = out.replace(/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+\b/g, "[redacted-token]");
  return scrubKnownSecrets(out, knownSecrets);
}

function redactContractString(value, knownSecrets = []) {
  return scrubKnownSecrets(value, knownSecrets);
}

function redactValue(value, key = "", knownSecrets = [], preserveContractFields = false) {
  if (typeof value === "string") {
    if (preserveContractFields && PRESERVED_CONTRACT_KEYS.has(key)) {
      return redactContractString(value, knownSecrets);
    }
    return redactString(value, key, knownSecrets);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, key, knownSecrets, preserveContractFields));
  }
  if (value && typeof value === "object") {
    const nextPreserve = preserveContractFields || key === "";
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nested]) => [
        nestedKey,
        redactValue(nested, nestedKey, knownSecrets, nextPreserve),
      ]),
    );
  }
  return value;
}

function writeFailure(error) {
  writeFileSync(redactedPath, JSON.stringify({ verdict: "FAILED", error }, null, 2));
}

const knownSecrets = collectKnownSecrets();

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

const redacted = redactValue(raw, "", knownSecrets);
writeFileSync(redactedPath, JSON.stringify(redacted, null, 2));
