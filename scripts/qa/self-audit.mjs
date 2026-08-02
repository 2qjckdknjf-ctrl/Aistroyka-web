#!/usr/bin/env node
/**
 * Phase 16 — QA self-audit: untested routes, APIs, permissions, AI flows.
 * Run: node scripts/qa/self-audit.mjs
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "../..");
const appsWeb = join(root, "apps/web");
const routesFile = join(root, "docs/qa/discovered/routes.json");
const outDir = join(root, "docs/qa/reports");

// Refresh discovery
spawnSync("node", [join(__dirname, "route-discovery.mjs")], { cwd: root, stdio: "inherit" });

if (!existsSync(routesFile)) {
  console.error("route discovery failed");
  process.exit(1);
}

const discovery = JSON.parse(readFileSync(routesFile, "utf8"));

function readAllQaText() {
  const dir = join(appsWeb, "tests/qa");
  const texts = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".ts")) texts.push(readFileSync(p, "utf8"));
    }
  };
  walk(dir);
  return texts.join("\n");
}

const qaText = readAllQaText();
const e2eDir = join(appsWeb, "tests/e2e");
let e2eText = "";
for (const f of readdirSync(e2eDir)) {
  if (f.endsWith(".ts")) e2eText += readFileSync(join(e2eDir, f), "utf8");
}

const allTestText = qaText + e2eText;

function isCovered(route) {
  const segments = route.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  if (last.startsWith("[") && last.endsWith("]")) {
    const parent = segments[segments.length - 2];
    if (parent && allTestText.includes(parent)) return true;
    return false;
  }
  return allTestText.includes(route) || allTestText.includes(last);
}

const untestedPages = discovery.pageRoutes.filter((r) => !isCovered(r));
const untestedApis = discovery.apiRoutes.filter((r) => !isCovered(r));

const permissionKeywords = ["owner", "admin", "member", "viewer", "stakeholder", "platform"];
const untestedPermissions = permissionKeywords.filter((p) => !allTestText.toLowerCase().includes(p));

const aiKeywords = [
  "copilot",
  "analyze-image",
  "transcribe",
  "intelligence",
  "help/assistant",
  "ai/analyze",
];
const untestedAi = aiKeywords.filter((k) => !allTestText.includes(k));

const vitestCount = spawnSync("find", [join(appsWeb), "-name", "*.test.ts"], { encoding: "utf8" });
const vitestFiles = vitestCount.stdout.trim().split("\n").filter(Boolean).length;

const coverage = {
  generatedAt: new Date().toISOString(),
  totals: discovery.counts,
  vitestFiles,
  pageCoverage: {
    total: discovery.pageRoutes.length,
    referencedInTests: discovery.pageRoutes.length - untestedPages.length,
    untested: untestedPages,
  },
  apiCoverage: {
    total: discovery.apiRoutes.length,
    referencedInTests: discovery.apiRoutes.length - untestedApis.length,
    untestedSample: untestedApis.slice(0, 50),
    untestedCount: untestedApis.length,
  },
  permissionGaps: untestedPermissions,
  aiFlowGaps: untestedAi,
};

const pagePct = Math.round((coverage.pageCoverage.referencedInTests / coverage.pageCoverage.total) * 100);
const apiPct = Math.round((coverage.apiCoverage.referencedInTests / coverage.apiCoverage.total) * 100);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "coverage-report.json"), JSON.stringify(coverage, null, 2));

const md = `# QA Coverage Report

Generated: ${coverage.generatedAt}

## Summary

| Surface | Total | Referenced in tests | Coverage |
|---------|-------|---------------------|----------|
| Pages | ${coverage.pageCoverage.total} | ${coverage.pageCoverage.referencedInTests} | ${pagePct}% |
| APIs | ${coverage.apiCoverage.total} | ${coverage.apiCoverage.referencedInTests} | ${apiPct}% |
| Vitest files | ${vitestFiles} | — | unit layer |

## Untested pages (${untestedPages.length})

${untestedPages.slice(0, 30).map((p) => `- \`${p}\``).join("\n")}
${untestedPages.length > 30 ? `\n… and ${untestedPages.length - 30} more` : ""}

## Untested APIs (${untestedApis.length})

${untestedApis.slice(0, 20).map((p) => `- \`${p}\``).join("\n")}
${untestedApis.length > 20 ? `\n… and ${untestedApis.length - 20} more` : ""}

## Permission test gaps

${untestedPermissions.length ? untestedPermissions.map((p) => `- ${p}`).join("\n") : "None detected"}

## AI flow gaps

${untestedAi.length ? untestedAi.map((p) => `- ${p}`).join("\n") : "None detected"}
`;

writeFileSync(join(outDir, "COVERAGE_REPORT.md"), md);
console.log(`Coverage: pages ${pagePct}%, APIs ${apiPct}% → docs/qa/reports/COVERAGE_REPORT.md`);
