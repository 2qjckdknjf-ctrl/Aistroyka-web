import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const artifactDir = process.env.AUDIT_ARTIFACT_DIR || path.join(root, "docs/audit/artifacts/local");
const reportPath = path.join(root, "docs/audit/E2E_AUDIT_REPORT.md");
const inventoryPath = path.join(root, "docs/audit/button_inventory.json");

function safeExec(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
}

function logStatus(name) {
  const file = path.join(artifactDir, `${name}.log`);
  if (!fs.existsSync(file)) return "not run";
  const content = fs.readFileSync(file, "utf8");
  if (/Step failed:|ERR!|not ok \d+|# fail [1-9]|unexpected":\s*[1-9]|exit code [1-9]/i.test(content)) return "failed";
  return "passed";
}

const inventory = fs.existsSync(inventoryPath)
  ? JSON.parse(fs.readFileSync(inventoryPath, "utf8"))
  : [];

const disabledEvidence = fs.existsSync(artifactDir)
  ? fs.readdirSync(artifactDir).filter((name) => name.endsWith(".disabled-cta.json"))
  : [];

const syncEvidence = path.join(artifactDir, "sync-e2e-requests.json");
const syncRequests = fs.existsSync(syncEvidence)
  ? JSON.parse(fs.readFileSync(syncEvidence, "utf8"))
  : [];

const failingStatuses = syncRequests.filter((entry) => {
  if (entry.status < 400) return false;
  const isExpectedConflictProbe =
    entry.method === "GET" &&
    String(entry.route).startsWith("/api/v1/sync/changes?cursor=100") &&
    entry.status === 409 &&
    entry.body?.code === "sync_conflict";
  return !isExpectedConflictProbe;
});
const playwrightStatus = logStatus("playwright_button_audit");
const rawSyncStatus = logStatus("sync_e2e");
const syncStatus = rawSyncStatus === "passed" && failingStatuses.length === 0 ? "passed" : rawSyncStatus;
const lintStatus = logStatus("lint");
const buildStatus = logStatus("build");
const pnpmVersion = safeExec("pnpm --version");
const pnpmStatus = pnpmVersion === "unknown" ? "missing in this local shell" : `available (${pnpmVersion})`;
const playwrightLogPath = path.join(artifactDir, "playwright_button_audit.log");
const syncLogPath = path.join(artifactDir, "sync_e2e.log");
const playwrightLog = fs.existsSync(playwrightLogPath) ? fs.readFileSync(playwrightLogPath, "utf8") : "";
const syncLog = fs.existsSync(syncLogPath) ? fs.readFileSync(syncLogPath, "utf8") : "";
function parsePlaywrightSummary(log) {
  const start = log.indexOf('{\n  "config"');
  if (start < 0) return { total: 0, passed: 0, failed: 0, skipped: 0 };
  try {
    const endMarker = "\nStep failed:";
    const end = log.indexOf(endMarker, start);
    const jsonText = end > start ? log.slice(start, end).trim() : log.slice(start).trim();
    const parsed = JSON.parse(jsonText);
    const stats = parsed.stats ?? {};
    return {
      total: Number(stats.expected ?? 0) + Number(stats.unexpected ?? 0) + Number(stats.skipped ?? 0) + Number(stats.flaky ?? 0),
      passed: Number(stats.expected ?? 0) + Number(stats.flaky ?? 0),
      failed: Number(stats.unexpected ?? 0),
      skipped: Number(stats.skipped ?? 0),
    };
  } catch {
    return { total: 0, passed: 0, failed: 0, skipped: 0 };
  }
}
const playwrightSummary = parsePlaywrightSummary(playwrightLog);
const authMissing =
  playwrightLog.includes("E2E_USER_EMAIL and E2E_USER_PASSWORD are required") ||
  syncLog.includes("E2E_USER_EMAIL is required") ||
  syncLog.includes("E2E_USER_PASSWORD is required");
const overall = playwrightStatus === "passed" && syncStatus === "passed" ? "PASS" : "FAIL";

const report = `# E2E Audit Report

## Environment

- Date: ${new Date().toISOString()}
- Commit SHA: ${safeExec("git rev-parse HEAD")}
- Base URL: ${process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "local http://127.0.0.1:3000"}
- Artifact directory: ${path.relative(root, artifactDir)}
- Requested command: \`pnpm -w audit:e2e\` (${pnpmStatus})
- Lint: ${lintStatus}
- Build sanity: ${buildStatus}

## Summary

| Area | Total | Passed | Failed | Intentionally disabled |
| --- | ---: | ---: | ---: | ---: |
| Static dashboard CTA inventory | ${inventory.length} | n/a | n/a | n/a |
| Runtime Playwright checks | ${playwrightSummary.total} | ${playwrightSummary.passed} | ${playwrightSummary.failed} | ${playwrightSummary.skipped} |
| Sync tests | 1 suite | ${syncStatus === "passed" ? 1 : 0} | ${syncStatus === "passed" ? 0 : 1} | 0 |

## Broken Buttons

${playwrightStatus === "passed" ? "No broken dashboard CTA failures were reported by the inventory-driven Playwright audit." : authMissing ? "No product CTA failure could be classified because authenticated audit execution was blocked before dashboard access. Root cause: missing `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` in the local audit environment." : `Playwright button audit did not pass. Review artifacts under \`${path.relative(root, artifactDir)}\`, especially \`playwright_button_audit.log\` and Playwright traces/screenshots.`}

Inventory source: \`docs/audit/button_inventory.json\` and \`docs/audit/button_inventory.csv\`.

### Fixed Audit Infrastructure Issues

- Root cause: Playwright rejected \`test.use({ trace, screenshot })\` inside \`describe\` blocks. Fix: moved audit trace/screenshot settings to top-level test scope/config.
- Root cause: the runner stopped before report generation on failures. Fix: each step now records status, always writes the report, and exits non-zero after report generation when failures remain.

## Sync Findings

- Bootstrap shape verdict: ${syncStatus === "passed" ? "PASS" : "FAIL or not completed"}
- Changes/ack stability: ${syncStatus === "passed" ? "PASS" : "FAIL or not completed"}
- Idempotency verdict: ${syncStatus === "passed" ? "PASS for report create and ack duplicate-key semantics" : "FAIL or not completed"}
- Conflict behavior: best-effort cursor-ahead probe executed when sync suite reached that step; see redacted request evidence.
- Request evidence: ${syncRequests.length ? `\`${path.relative(root, syncEvidence)}\`` : "not available"}

${failingStatuses.length ? `### Sync Failure Statuses\n\n${failingStatuses.map((entry) => `- ${entry.method} ${entry.route}: ${entry.status}`).join("\n")}` : ""}

## Remaining Gaps / Next Steps

${overall === "PASS" ? "- No blocking gaps remain from this audit run." : [
  authMissing ? "- BLOCKER: provide `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, and Supabase anon URL/key or `E2E_ACCESS_TOKEN` via gitignored `.env.e2e` / CI secrets so authenticated button and sync E2E can execute." : "- Resolve failing audit items shown in the artifact logs.",
  pnpmStatus.startsWith("missing") ? "- BLOCKER: `pnpm` is not installed in this local Volta toolchain, so the exact `pnpm -w audit:e2e` command cannot be executed here until pnpm is installed/enabled." : "- Re-run `pnpm -w audit:e2e`.",
].join("\n")}

## Verdict

- BUTTON E2E: ${playwrightStatus === "passed" ? "PASS" : "FAIL"}
- SYNC E2E: ${syncStatus === "passed" ? "PASS" : "FAIL"}
- OVERALL: ${overall}
`;

fs.writeFileSync(reportPath, report);
console.log(`Wrote ${reportPath}`);
