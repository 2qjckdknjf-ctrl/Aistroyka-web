#!/usr/bin/env node
/**
 * Staging-only stakeholder persona helper.
 * Does not print secrets. Refuses production hosts.
 *
 * Required env (all external, never committed):
 *   PILOT_E2E_BASE_URL          staging origin
 *   E2E_EMAIL / E2E_PASSWORD    contractor persona (manager/owner)
 *   STAKEHOLDER_SMOKE_EMAIL / STAKEHOLDER_SMOKE_PASSWORD  dedicated stakeholder
 *   E2E_PROJECT_ID              project to invite onto
 *   STAGING_STAKEHOLDER_PROVISION=YES to mutate staging
 *
 * Usage:
 *   node scripts/pilot/provision_staging_stakeholder_persona.mjs --dry-run
 *   STAGING_STAKEHOLDER_PROVISION=YES node scripts/pilot/provision_staging_stakeholder_persona.mjs
 */

const PRODUCTION_HOSTS = ["aistroyka.ai", "www.aistroyka.ai"];

function present(v) {
  return Boolean(v && String(v).trim());
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function redactEmail(email) {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at < 1) return "REDACTED";
  return `${s[0]}***${s.slice(at)}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || process.env.STAGING_STAKEHOLDER_PROVISION !== "YES";
  const base = process.env.PILOT_E2E_BASE_URL || process.env.STAKEHOLDER_FINANCE_BASE_URL || "";
  const contractorEmail = process.env.E2E_EMAIL || process.env.PILOT_E2E_EMAIL || "";
  const contractorPassword = process.env.E2E_PASSWORD || process.env.PILOT_E2E_PASSWORD || "";
  const stakeholderEmail = process.env.STAKEHOLDER_SMOKE_EMAIL || "";
  const stakeholderPassword = process.env.STAKEHOLDER_SMOKE_PASSWORD || "";
  const projectId = process.env.E2E_PROJECT_ID || process.env.PILOT_E2E_PROJECT_ID || "";

  const host = hostOf(base);
  if (!host) {
    console.log("STATUS: BLOCKED");
    console.log("REASON: PILOT_E2E_BASE_URL missing");
    process.exit(1);
  }
  if (PRODUCTION_HOSTS.includes(host)) {
    console.log("STATUS: BLOCKED");
    console.log("REASON: production host refused");
    process.exit(1);
  }
  if (contractorEmail && stakeholderEmail && contractorEmail.toLowerCase() === stakeholderEmail.toLowerCase()) {
    console.log("STATUS: BLOCKED");
    console.log("REASON: contractor and stakeholder emails must be distinct personas");
    process.exit(1);
  }

  console.log("BASE_HOST:", host);
  console.log("CONTRACTOR_EMAIL:", present(contractorEmail) ? redactEmail(contractorEmail) : "MISSING");
  console.log("STAKEHOLDER_EMAIL:", present(stakeholderEmail) ? redactEmail(stakeholderEmail) : "MISSING");
  console.log("PROJECT_ID:", present(projectId) ? "PRESENT" : "MISSING");
  console.log("CONTRACTOR_PASSWORD:", present(contractorPassword) ? "PRESENT" : "MISSING");
  console.log("STAKEHOLDER_PASSWORD:", present(stakeholderPassword) ? "PRESENT" : "MISSING");

  if (!present(contractorEmail) || !present(stakeholderEmail) || !present(projectId)) {
    console.log("STATUS: BLOCKED_EXTERNAL");
    console.log("REASON: dedicated personas or project id missing from env");
    process.exit(1);
  }

  if (dryRun) {
    console.log("STATUS: DRY_RUN");
    console.log("NEXT: invite via POST /api/v1/projects/:id/stakeholders then accept as stakeholder");
    console.log("REVOKE: POST revoke on the same membership id");
    process.exit(0);
  }

  console.log("STATUS: NOT_EXECUTED");
  console.log("REASON: live invite/accept still requires an authenticated contractor session in this environment");
  process.exit(2);
}

main().catch((err) => {
  console.log("STATUS: ERROR");
  console.log("REASON:", err instanceof Error ? err.message : "unknown");
  process.exit(1);
});
