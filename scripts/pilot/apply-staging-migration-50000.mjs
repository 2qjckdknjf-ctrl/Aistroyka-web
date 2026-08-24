#!/usr/bin/env node
/**
 * Apply migration 20260824150000 to AISTROYKA staging only.
 * Requires: SUPABASE_ACCESS_TOKEN, STAGING_MIGRATION_20260824150000_APPLY=YES
 * Never prints secrets or row data.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const STAGING_REF = "vthfrxehrursfloevnlp";
const VERSION = "20260824150000";
const MIGRATION_FILE = `apps/web/supabase/migrations/${VERSION}_pilot_governed_ai_evidence_security_hardening.sql`;
const EXPECTED_CHECKSUM = "60ca456431a7fb2870aa5e765cc0fee66d8837c767b147f76adf927c4a0e449a";
const PRIOR_VERSIONS = ["20260824122312", "20260824122423", "20260824123120"];

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const marker = process.env.STAGING_MIGRATION_20260824150000_APPLY?.trim();
const projectRefInput = process.env.SUPABASE_PROJECT_REF?.trim();

function fail(msg, code = 1) {
  console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  process.exit(code);
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

async function main() {
  if (marker !== "YES") fail("STAGING_MIGRATION_20260824150000_APPLY must be YES");
  if (!token) fail("SUPABASE_ACCESS_TOKEN missing");
  if (projectRefInput && projectRefInput !== STAGING_REF) {
    fail(`SUPABASE_PROJECT_REF mismatch: expected ${STAGING_REF}`);
  }

  const sqlPath = resolve(ROOT, MIGRATION_FILE);
  const sql = readFileSync(sqlPath, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  if (checksum !== EXPECTED_CHECKSUM) {
    fail(`checksum mismatch: got ${checksum}, expected ${EXPECTED_CHECKSUM}`);
  }
  const lower = sql.toLowerCase();
  if (/drop table|truncate table/.test(lower)) fail("destructive DDL detected");

  const project = await api(`/projects/${STAGING_REF}`);
  if (project.status !== 200) fail(`project lookup failed HTTP ${project.status}`);

  const { status: listStatus, body: migrations } = await api(`/projects/${STAGING_REF}/database/migrations`);
  if (listStatus !== 200 || !Array.isArray(migrations)) {
    fail(`list migrations failed HTTP ${listStatus}`);
  }

  const versions = new Set(migrations.map((m) => String(m.version)));
  for (const v of PRIOR_VERSIONS) {
    if (!versions.has(v)) fail(`preflight: missing prior migration ${v}`);
  }
  if (versions.has(VERSION)) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: "already_applied", version: VERSION }, null, 2));
    process.exit(0);
  }

  const apply = await api(`/projects/${STAGING_REF}/database/migrations`, {
    method: "POST",
    body: JSON.stringify({
      query: sql,
      name: "pilot_governed_ai_evidence_security_hardening",
    }),
  });

  if (apply.status !== 200 && apply.status !== 201) {
    fail(`apply failed HTTP ${apply.status}: ${JSON.stringify(apply.body).slice(0, 300)}`);
  }

  const { body: after } = await api(`/projects/${STAGING_REF}/database/migrations`);
  const applied = Array.isArray(after) && after.some((m) => String(m.version) === VERSION);
  if (!applied) fail("post-check: migration not in remote history");

  console.log(
    JSON.stringify(
      {
        ok: true,
        project_ref: STAGING_REF,
        version: VERSION,
        checksum,
        prior_present: PRIOR_VERSIONS,
        remote_migration_count: after.length,
        production: "untouched",
        backfill: false,
      },
      null,
      2
    )
  );
}

main().catch((e) => fail(e.message));
