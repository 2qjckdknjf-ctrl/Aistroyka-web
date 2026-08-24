#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const rawPath = "e2e-result.json";
const redactedPath = "e2e-result-redacted.json";

const SENSITIVE_KEY =
  /(?:password|secret|token|api[_-]?key|bypass|authorization|anon[_-]?key|credential|email)/i;

const KNOWN_SECRET_ENV_KEYS = [
  "REDACT_VERCEL_BYPASS",
  "REDACT_WORKER_PASS",
  "REDACT_MANAGER_PASS",
  "REDACT_OWNER_PASS",
  "REDACT_STAKEHOLDER_REVOKED_PASS",
  "REDACT_CROSS_TENANT_PASS",
  "REDACT_SUPABASE_ANON",
  "REDACT_WORKER_EMAIL",
  "REDACT_MANAGER_EMAIL",
  "REDACT_OWNER_EMAIL",
  "REDACT_STAKEHOLDER_REVOKED_EMAIL",
  "REDACT_CROSS_TENANT_EMAIL",
];

/** Root-level contract fields are never preserved from harness output. */
const PRESERVED_ROOT_KEYS = new Set();

const ALLOWED_ROOT_KEYS = new Set(["verdict", "base", "deployedSha7", "results", "error"]);

function redactResultEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const step = value.step;
  const status = value.status;
  if (typeof step !== "number" || !Number.isInteger(step) || step < 1 || step > 25) {
    return null;
  }
  if (typeof status !== "string") {
    return null;
  }
  return {
    step,
    status: redactString(status, "status"),
  };
}

function redactRootRecord(value, knownSecrets) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { verdict: "FAILED", error: "invalid e2e root" };
  }
  const record = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      continue;
    }
    if (key === "results") {
      if (!Array.isArray(nested)) {
        record.results = [];
        continue;
      }
      record.results = nested
        .map((entry) => redactResultEntry(entry))
        .filter((entry) => entry !== null);
      continue;
    }
    if (typeof nested !== "string") {
      continue;
    }
    record[key] = redactString(nested, key, knownSecrets);
  }
  if (!Array.isArray(record.results)) {
    record.results = [];
  }
  return record;
}

function collectKnownSecrets() {
  return KNOWN_SECRET_ENV_KEYS.map((key) => process.env[key])
    .filter((value) => typeof value === "string" && value.length >= 3)
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

function redactValue(value, key = "", knownSecrets = [], isRootChild = false) {
  if (typeof value === "string") {
    if (isRootChild && PRESERVED_ROOT_KEYS.has(key)) {
      return scrubKnownSecrets(value, knownSecrets);
    }
    return redactString(value, key, knownSecrets);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, key, knownSecrets, false));
  }
  if (value && typeof value === "object") {
    const rootObject = key === "";
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nested]) => [
        nestedKey,
        redactValue(nested, nestedKey, knownSecrets, rootObject),
      ]),
    );
  }
  return value;
}

function normalizeOrigin(input) {
  return input.trim().replace(/\/+$/, "");
}

function injectTrustedContractFields(record) {
  const trustedOrigin = process.env.TRUSTED_CANONICAL_ORIGIN?.trim();
  const targetSha = process.env.TARGET_SHA?.trim();
  if (trustedOrigin) {
    record.base = normalizeOrigin(trustedOrigin);
  }
  if (targetSha && /^[a-f0-9]{40}$/i.test(targetSha)) {
    record.deployedSha7 = targetSha.slice(0, 7);
  }
  return record;
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

const redacted = injectTrustedContractFields(redactRootRecord(raw, knownSecrets));
writeFileSync(redactedPath, JSON.stringify(redacted, null, 2));
