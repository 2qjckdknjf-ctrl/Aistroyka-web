#!/usr/bin/env node
/**
 * Pilot go-live check: health, cron-tick (with secret), debug blocked, optional ops.
 * Usage: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx node scripts/pilot-go-live-check.mjs
 * Optional: PILOT_SKIP_CRON=1 to skip cron check (when secret not available in env).
 * Writes reports/pilot-launch/pilot-go-live-check-YYYY-MM-DDTHH-mm-ss.md and .json
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const base = (process.env.PILOT_BASE_URL || "").trim().replace(/\/+$/, "");
const cronSecret = (process.env.CRON_SECRET || "").trim();
const skipCron = process.env.PILOT_SKIP_CRON === "1" || process.env.PILOT_SKIP_CRON === "true";

const results = [];
function record(name, status, message) {
  results.push({ name, status, message });
}

if (!base) {
  console.error("PILOT_BASE_URL is required. Example: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx node scripts/pilot-go-live-check.mjs");
  process.exit(1);
}

const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

async function run() {
  console.log("Pilot go-live check:", base);
  console.log("");

  // 1. GET /api/health
  try {
    const res = await fetch(`${base}/api/health`, { method: "GET", signal: AbortSignal.timeout(15000) });
    const ok = res.ok && res.status === 200;
    let body = "";
    try { body = await res.text(); } catch (_) {}
    const hasOk = body.includes('"ok"') && (body.includes('"ok":true') || body.includes('"ok": true'));
    if (ok && hasOk) {
      record("health", "PASS", "GET /api/health → 200, body has ok:true");
      console.log("[PASS] GET /api/health → 200, ok:true");
    } else if (res.status === 200 && !hasOk) {
      record("health", "WARN", `GET /api/health → 200 but body missing "ok":true`);
      console.log("[WARN] GET /api/health → 200 but body missing ok:true");
    } else {
      record("health", "FAIL", `GET /api/health → ${res.status}`);
      console.log("[FAIL] GET /api/health →", res.status);
    }
  } catch (e) {
    record("health", "FAIL", e.message || "Request failed");
    console.log("[FAIL] GET /api/health —", e.message);
  }

  // 2. GET /api/v1/health
  try {
    const res = await fetch(`${base}/api/v1/health`, { method: "GET", signal: AbortSignal.timeout(15000) });
    const body = await res.text();
    const hasOk = body.includes('"ok"') && (body.includes('"ok":true') || body.includes('"ok": true'));
    if (res.ok && hasOk) {
      record("v1_health", "PASS", "GET /api/v1/health → 200, ok:true");
      console.log("[PASS] GET /api/v1/health → 200");
    } else {
      record("v1_health", res.ok ? "WARN" : "FAIL", `GET /api/v1/health → ${res.status}`);
      console.log(res.ok ? "[WARN]" : "[FAIL]", "GET /api/v1/health →", res.status);
    }
  } catch (e) {
    record("v1_health", "FAIL", e.message || "Request failed");
    console.log("[FAIL] GET /api/v1/health —", e.message);
  }

  // 3. Debug/diag blocked (production: expect 404)
  try {
    const res = await fetch(`${base}/api/_debug/auth`, { method: "GET", signal: AbortSignal.timeout(10000) });
    if (res.status === 404) {
      record("debug_blocked", "PASS", "GET /api/_debug/auth → 404 (blocked)");
      console.log("[PASS] GET /api/_debug/auth → 404");
    } else {
      record("debug_blocked", "FAIL", `GET /api/_debug/auth → ${res.status} (should be 404 in production)`);
      console.log("[FAIL] GET /api/_debug/auth →", res.status, "(expect 404 in prod)");
    }
  } catch (e) {
    record("debug_blocked", "WARN", e.message || "Request failed");
    console.log("[WARN] GET /api/_debug/auth —", e.message);
  }

  // 4. Cron-tick with secret
  if (!skipCron && cronSecret) {
    try {
      const res = await fetch(`${base}/api/v1/admin/jobs/cron-tick`, {
        method: "POST",
        headers: { "x-cron-secret": cronSecret },
        signal: AbortSignal.timeout(60000),
      });
      const body = await res.text();
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      if (res.status === 200 && data.ok === true) {
        record("cron_tick", "PASS", `POST cron-tick → 200, ok:true, scheduled=${data.scheduled ?? "?"}, processed=${data.processed ?? "?"}`);
        console.log("[PASS] POST /api/v1/admin/jobs/cron-tick → 200");
      } else {
        record("cron_tick", "FAIL", `POST cron-tick → ${res.status} ${body.slice(0, 80)}`);
        console.log("[FAIL] POST cron-tick →", res.status);
      }
    } catch (e) {
      record("cron_tick", "FAIL", e.message || "Request failed");
      console.log("[FAIL] POST cron-tick —", e.message);
    }
  } else if (skipCron) {
    record("cron_tick", "WARN", "Skipped (PILOT_SKIP_CRON=1)");
    console.log("[WARN] Cron-tick skipped (PILOT_SKIP_CRON=1)");
  } else {
    record("cron_tick", "WARN", "Skipped (no CRON_SECRET)");
    console.log("[WARN] Cron-tick skipped (no CRON_SECRET)");
  }

  // 5. Cron-tick without secret → 403 or 503
  try {
    const res = await fetch(`${base}/api/v1/admin/jobs/cron-tick`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 403 || res.status === 503) {
      record("cron_blocked", "PASS", `POST cron-tick without secret → ${res.status}`);
      console.log("[PASS] POST cron-tick without secret →", res.status);
    } else if (res.status === 200) {
      record("cron_blocked", "FAIL", "POST cron-tick without secret → 200 (cron should require secret)");
      console.log("[FAIL] Cron-tick allowed without secret → 200");
    } else {
      record("cron_blocked", "WARN", `POST cron-tick without secret → ${res.status}`);
      console.log("[WARN] POST cron-tick without secret →", res.status);
    }
  } catch (e) {
    record("cron_blocked", "WARN", e.message || "Request failed");
    console.log("[WARN] Cron-tick (no secret) —", e.message);
  }

  const failCount = results.filter((r) => r.status === "FAIL").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  const verdict = failCount > 0 ? "FAIL" : warnCount > 0 ? "PASS_WITH_WARNINGS" : "PASS";

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: base,
    verdict,
    failCount,
    warnCount,
    results,
  };

  const md = `# Pilot go-live check

**Base URL:** ${base}
**Verdict:** ${verdict}
**Time:** ${report.timestamp}

| Check | Status | Message |
|-------|--------|---------|
${results.map((r) => `| ${r.name} | ${r.status} | ${r.message} |`).join("\n")}

## Verdict

- **PASS:** All critical checks passed.
- **PASS_WITH_WARNINGS:** Passed with optional/skipped checks; acceptable if documented.
- **FAIL:** One or more critical checks failed; do not go live until fixed.
`;

  const reportsDir = resolve(root, "reports/pilot-launch");
  mkdirSync(reportsDir, { recursive: true });
  const slug = `pilot-go-live-check-${ts}`;
  writeFileSync(resolve(reportsDir, `${slug}.md`), md);
  writeFileSync(resolve(reportsDir, `${slug}.json`), JSON.stringify(report, null, 2));

  console.log("");
  console.log("Verdict:", verdict);
  console.log("Report: reports/pilot-launch/" + slug + ".md");
  process.exit(verdict === "FAIL" ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
