#!/usr/bin/env node
/**
 * Phase 18 — Aggregate QA artifacts into release verdict.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "../..");
const artifactDir = process.env.QA_ARTIFACT_DIR || join(root, "docs/qa/artifacts/latest");
const reportsDir = join(root, "docs/qa/reports");

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function verdictFromPlaywright(results) {
  if (!results) return "UNKNOWN";
  const failed = results.stats?.unexpected ?? results.stats?.failures ?? 0;
  const passed = results.stats?.expected ?? results.stats?.passes ?? 0;
  if (passed === 0 && failed === 0) return "UNKNOWN";
  return failed === 0 ? "YES" : "NO";
}

const pwResults = readJson(join(dirname(artifactDir), "results.json"));
const coverage = readJson(join(reportsDir, "coverage-report.json"));
const backend = readJson(join(artifactDir, "reports", "backend-network.json"));
const security = readJson(join(artifactDir, "reports", "security.json"));
const performance = readJson(join(artifactDir, "reports", "performance.json"));

const pwVerdict = verdictFromPlaywright(pwResults);

const verdict = {
  generatedAt: new Date().toISOString(),
  PUBLIC_SITE_READY: pwVerdict === "YES" ? "YES" : pwVerdict === "NO" ? "NO" : "UNKNOWN",
  DASHBOARD_READY: process.env.E2E_EMAIL || process.env.E2E_USER_EMAIL ? pwVerdict : "UNKNOWN",
  BACKEND_READY: backend ? (backend.issues?.filter((i) => i.status >= 500).length === 0 ? "YES" : "NO") : "UNKNOWN",
  DATABASE_READY: "UNKNOWN",
  DESIGN_READY: pwVerdict === "YES" ? "YES" : "UNKNOWN",
  RESPONSIVE_READY: pwVerdict === "YES" ? "YES" : "UNKNOWN",
  AI_READY: "UNKNOWN",
  PERFORMANCE_READY: performance ? (performance.elapsed < (performance.budgetMs ?? 8000) ? "YES" : "NO") : "UNKNOWN",
  SECURITY_READY: security ? (security.every((f) => !f.leaked) ? "YES" : "NO") : "UNKNOWN",
  ACCESSIBILITY_READY: pwVerdict === "YES" ? "YES" : "UNKNOWN",
  CI_READY: existsSync(join(root, ".github/workflows/qa-platform.yml")) ? "YES" : "NO",
  RELEASE_READY: "UNKNOWN",
};

let score = 0;
const weights = {
  PUBLIC_SITE_READY: 10,
  DASHBOARD_READY: 10,
  BACKEND_READY: 10,
  DATABASE_READY: 8,
  DESIGN_READY: 8,
  RESPONSIVE_READY: 8,
  AI_READY: 10,
  PERFORMANCE_READY: 8,
  SECURITY_READY: 10,
  ACCESSIBILITY_READY: 8,
  CI_READY: 10,
  RELEASE_READY: 10,
};
for (const [key, weight] of Object.entries(weights)) {
  const v = verdict[key];
  if (v === "YES") score += weight;
  else if (v === "UNKNOWN") score += Math.floor(weight * 0.3);
}
verdict.PROJECT_QUALITY_SCORE = `${score}/100`;

const issues = { P0: [], P1: [], P2: [] };
if (verdict.PUBLIC_SITE_READY === "NO") issues.P0.push("Public site Playwright failures detected");
if (verdict.SECURITY_READY === "NO") issues.P0.push("Security probe detected secret leakage or open sensitive endpoints");
if (verdict.BACKEND_READY === "NO") issues.P0.push("Dashboard navigation produced 5xx API errors");
if (verdict.DASHBOARD_READY === "UNKNOWN") issues.P1.push("Dashboard E2E not verified — set E2E_EMAIL/E2E_PASSWORD");
if (verdict.AI_READY === "UNKNOWN") issues.P1.push("Live AI not verified in QA platform — run ai_live_provider.sh separately");
if (coverage?.apiCoverage?.untestedCount > 200) issues.P1.push(`API coverage gap: ${coverage.apiCoverage.untestedCount} routes not referenced in tests`);
if (verdict.PERFORMANCE_READY === "NO") issues.P2.push("Homepage load exceeded performance budget");
issues.P2.push("Multi-role credential matrix not fully provisioned (QA_OWNER_*, QA_WORKER_*, QA_CLIENT_*)");

verdict.issues = issues;
verdict.recommendedFixes = [
  "Provision E2E + multi-role credentials in .env.qa for staging nightly",
  "Run bash scripts/smoke/ai_live_provider.sh --require-live for AI_READY proof",
  "Initialize visual regression baselines: bun run qa:public with QA_UPDATE_SNAPSHOTS=1",
  "Expand portal stakeholder Playwright flows with STAKEHOLDER_SMOKE_* creds",
];
verdict.estimatedReleaseReadiness =
  score >= 75 ? "CONDITIONAL — core gates pass; role/AI/live gaps remain" : score >= 50 ? "NOT READY — significant UNKNOWN domains" : "NOT READY — blocking failures";

mkdirSync(reportsDir, { recursive: true });
writeFileSync(join(reportsDir, "RELEASE_VERDICT.json"), JSON.stringify(verdict, null, 2));

const md = `# QA Release Verdict

Generated: ${verdict.generatedAt}

## Verdicts

| Domain | Status |
|--------|--------|
| PUBLIC_SITE_READY | ${verdict.PUBLIC_SITE_READY} |
| DASHBOARD_READY | ${verdict.DASHBOARD_READY} |
| BACKEND_READY | ${verdict.BACKEND_READY} |
| DATABASE_READY | ${verdict.DATABASE_READY} |
| DESIGN_READY | ${verdict.DESIGN_READY} |
| RESPONSIVE_READY | ${verdict.RESPONSIVE_READY} |
| AI_READY | ${verdict.AI_READY} |
| PERFORMANCE_READY | ${verdict.PERFORMANCE_READY} |
| SECURITY_READY | ${verdict.SECURITY_READY} |
| ACCESSIBILITY_READY | ${verdict.ACCESSIBILITY_READY} |
| CI_READY | ${verdict.CI_READY} |
| RELEASE_READY | ${verdict.RELEASE_READY} |

**PROJECT_QUALITY_SCORE:** ${verdict.PROJECT_QUALITY_SCORE}

## P0
${issues.P0.map((i) => `- ${i}`).join("\n") || "- None"}

## P1
${issues.P1.map((i) => `- ${i}`).join("\n") || "- None"}

## P2
${issues.P2.map((i) => `- ${i}`).join("\n") || "- None"}

## Recommended fixes
${verdict.recommendedFixes.map((i) => `- ${i}`).join("\n")}

**Estimated release readiness:** ${verdict.estimatedReleaseReadiness}
`;

writeFileSync(join(reportsDir, "RELEASE_VERDICT.md"), md);
console.log(`Release verdict: ${verdict.PROJECT_QUALITY_SCORE} → docs/qa/reports/RELEASE_VERDICT.md`);
