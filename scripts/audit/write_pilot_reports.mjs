import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const artifactDir = process.env.AUDIT_ARTIFACT_DIR || path.join(root, "docs/audit/artifacts/latest");

function readCode(name) {
  const file = path.join(artifactDir, `step_${name}.code`);
  if (!fs.existsSync(file)) return null;
  return Number(fs.readFileSync(file, "utf8").trim());
}

function statusFromCode(code) {
  if (code === null) return "NOT RUN";
  return code === 0 ? "PASS" : "FAIL";
}

function allStepsPresent() {
  const required = ["install", "test", "build", "button_inventory", "smoke_pilot", "playwright"];
  return required.every((n) => readCode(n) !== null);
}

function safeExec(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
}

const install = statusFromCode(readCode("install"));
const test = statusFromCode(readCode("test"));
const build = statusFromCode(readCode("build"));
const smoke = statusFromCode(readCode("smoke_pilot"));
const playwright = statusFromCode(readCode("playwright"));
const inventory = statusFromCode(readCode("button_inventory"));

const relArtifactPath =
  allStepsPresent() && fs.existsSync(artifactDir) ? path.relative(root, artifactDir) : null;
const artifactNote = relArtifactPath
  ? `\`${relArtifactPath}\``
  : "_(no timestamped artifact dir yet — run `bun run audit:pilot`)_";
const logRef = (name) => (relArtifactPath ? `\`${relArtifactPath}/${name}\`` : "_(pilot audit not run)_");
const sha = safeExec("git rev-parse HEAD");
const when = new Date().toISOString();

const stepsOk =
  [install, test, build, inventory, smoke, playwright].every((s) => s === "PASS") && allStepsPresent();
const overall = stepsOk ? "PASS" : "FAIL";

const projectState = `# PROJECT_STATE (Pilot Audit)

> Regenerate: \`bun run audit:pilot\` from repo root. Authenticated steps need \`.env.pilot\` (see \`.env.pilot.example\`).

- Generated: ${when}
- Commit: \`${sha}\`
- Artifact directory: ${artifactNote}

## PASS/FAIL matrix

| Area | Status | Evidence |
|------|--------|----------|
| Dependencies (\`bun install\` when needed) | **${install}** | ${logRef("bun_install.log")} |
| Unit / Vitest (root \`bun run test\`) | **${test}** | ${logRef("unit_test.log")} |
| Production build (root \`bun run build\`) | **${build}** | ${logRef("build.log")} |
| Static button inventory gen | **${inventory}** | ${logRef("button_inventory.log")}, \`docs/audit/button_inventory.json\` |
| Smoke \`smoke:pilot\` | **${smoke}** | ${logRef("pilot_smoke.log")} |
| Playwright pilot suite (buttons + sync + core) | **${playwright}** | ${logRef("playwright_pilot.log")}, ${relArtifactPath ? `\`${relArtifactPath}/playwright-test-output/\`, \`${relArtifactPath}/playwright-traces/\`` : "_(pilot audit not run)_"} |
| Buttons E2E (inventory-driven) | **${playwright === "PASS" ? "PASS" : "FAIL / NOT VERIFIED"}** | same as Playwright |
| Sync contract E2E | **${playwright === "PASS" ? "PASS" : "FAIL / NOT VERIFIED"}** | ${relArtifactPath ? `\`${relArtifactPath}/sync-logs/sync-contract.log\` (if present)` : "_(pilot audit not run)_"} |
| Core flow E2E | **${playwright === "PASS" ? "PASS" : "FAIL / NOT VERIFIED"}** | Playwright traces |
| Auth/login reliability | **${playwright === "PASS" ? "PASS" : "FAIL / NOT VERIFIED"}** | \`tests/e2e/auth.setup.ts\`, \`tests/e2e/_state/auth.json\` |
| Auth / Cost / Budget / Docs / Approvals / AI / Release smoke | **NOT VERIFIED** (matrix slot) | Extend suite or mark from smoke logs |

## Verdict

- **OVERALL_PILOT_READY:** **${overall}**
`;

fs.mkdirSync(path.dirname(path.join(root, "docs/audit/PROJECT_STATE.md")), { recursive: true });
fs.writeFileSync(path.join(root, "docs/audit/PROJECT_STATE.md"), projectState);

const pwLog = fs.existsSync(path.join(artifactDir, "playwright_pilot.log"))
  ? fs.readFileSync(path.join(artifactDir, "playwright_pilot.log"), "utf8")
  : "";

const e2eReport = `# E2E Audit Report (Pilot)

- Generated: ${when}
- Commit: \`${sha}\`
- Artifact directory: ${artifactNote}

## Summary

| Step | Status |
|------|--------|
| install | ${install} |
| test | ${test} |
| build | ${build} |
| button_inventory | ${inventory} |
| smoke:pilot | ${smoke} |
| playwright pilot | ${playwright} |

## Broken buttons / UI audit

${playwright === "PASS" ? "No Playwright pilot failures recorded in step code; inspect log for flaky skips." : "See Playwright output and traces under artifact dir. Search for \`Error:\` / failed expectations in \`playwright_pilot.log\`."}

## Sync contract

See \`tests/e2e/sync-contract.spec.ts\` and redacted sync log under the timestamped artifact dir when generated.

## Core flow

See \`tests/e2e/core-flow.spec.ts\`. If credentials or tenant data are missing, tests document NOT VERIFIED.

## Log excerpt (Playwright)

\`\`\`
${pwLog.slice(-8000)}
\`\`\`

## Final verdict (explicit)

- **BUTTONS_E2E:** ${playwright === "PASS" ? "PASS" : "FAIL"}
- **SYNC_E2E:** ${playwright === "PASS" ? "PASS" : "FAIL"}
- **CORE_FLOW_E2E:** ${playwright === "PASS" ? "PASS" : "FAIL"}
- **OVERALL_PILOT_READY:** ${overall === "PASS" ? "PASS" : "FAIL"}

Note: pilot Playwright is one suite exit code; for independent area verdicts, inspect \`playwright_pilot.log\` per spec file.
`;

fs.writeFileSync(path.join(root, "docs/audit/E2E_AUDIT_REPORT.md"), e2eReport);
console.log("Wrote docs/audit/PROJECT_STATE.md and docs/audit/E2E_AUDIT_REPORT.md");
