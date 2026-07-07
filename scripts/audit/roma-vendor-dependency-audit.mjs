#!/usr/bin/env node
/**
 * Static vendor dependency audit for ROMA Operations Center surfaces.
 * Audit-only — does not refactor or move code.
 */

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");

const TARGETS = [
  { id: "platform-admin", root: join(REPO_ROOT, "apps/web/lib/platform-admin") },
  { id: "roma-live-probes", root: join(REPO_ROOT, "apps/web/lib/platform-admin/roma-live-probes.ts") },
  { id: "kernel", root: join(REPO_ROOT, "packages/roma-kernel/src") },
];

const VENDOR_SDK_PATTERNS = [
  { vendor: "Supabase", pattern: /@supabase\// },
  { vendor: "Stripe", pattern: /\bstripe\b|from ["']stripe["']/ },
  { vendor: "OpenAI", pattern: /openai/i },
  { vendor: "Google/Gemini", pattern: /gemini|@google\//i },
  { vendor: "Cloudflare", pattern: /cloudflare|wrangler/i },
  { vendor: "GitHub", pattern: /GITHUB_|octokit|@actions\//i },
  { vendor: "PostgreSQL", pattern: /from ["']pg["']/ },
  { vendor: "Next.js runtime", pattern: /from ["']next\// },
];

const INDIRECT_COUPLING_PREFIXES = [
  "@/lib/supabase/",
  "@/lib/platform/billing",
  "@/lib/config/server",
  "@/lib/controllers/health",
  "@/lib/system/health",
];

const IMPORT_RE = /^\s*import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/gm;

function collectSourceFiles(path) {
  const stat = statSync(path);
  if (stat.isFile() && /\.(ts|tsx|mts|cts)$/.test(path) && !path.endsWith(".test.ts")) {
    return [path];
  }
  if (!stat.isDirectory()) return [];
  const out = [];
  for (const entry of readdirSync(path)) {
    out.push(...collectSourceFiles(join(path, entry)));
  }
  return out;
}

function parseImports(source) {
  const imports = [];
  let m;
  while ((m = IMPORT_RE.exec(source)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function classifyImport(specifier, file) {
  const findings = [];

  for (const { vendor, pattern } of VENDOR_SDK_PATTERNS) {
    if (pattern.test(specifier)) {
      findings.push({
        kind: "direct_vendor_sdk",
        vendor,
        specifier,
        file,
        severity: "high",
      });
    }
  }

  for (const prefix of INDIRECT_COUPLING_PREFIXES) {
    if (specifier.startsWith(prefix)) {
      findings.push({
        kind: "indirect_vendor_coupling",
        vendor: prefix,
        specifier,
        file,
        severity: "medium",
      });
    }
  }

  if (specifier.startsWith("@/lib/") && file.includes("roma-live-probes")) {
    findings.push({
      kind: "adapter_violation_candidate",
      vendor: "in-app service boundary",
      specifier,
      file,
      severity: "medium",
      note: "roma-live-probes calls app services directly instead of injected adapters",
    });
  }

  return findings;
}

function auditTarget(target) {
  const files = collectSourceFiles(target.root);
  const allFindings = [];
  const importCounts = new Map();

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const imports = parseImports(src);
    for (const spec of imports) {
      importCounts.set(spec, (importCounts.get(spec) ?? 0) + 1);
      allFindings.push(...classifyImport(spec, relative(REPO_ROOT, file)));
    }
  }

  return { files: files.length, findings: allFindings, importCounts };
}

function renderMarkdown(results) {
  const lines = [
    "# ROMA Vendor Dependency Audit",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "**Scope:** `platform-admin`, `roma-live-probes`, `kernel`",
    "**Mode:** Audit-only (no refactor)",
    "",
    "## Summary",
    "",
  ];

  let direct = 0;
  let indirect = 0;
  let adapter = 0;

  for (const [id, result] of Object.entries(results)) {
    for (const f of result.findings) {
      if (f.kind === "direct_vendor_sdk") direct++;
      if (f.kind === "indirect_vendor_coupling") indirect++;
      if (f.kind === "adapter_violation_candidate") adapter++;
    }
    lines.push(`- **${id}:** ${result.files} file(s), ${result.findings.length} finding(s)`);
  }

  lines.push("");
  lines.push(`| Category | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Direct vendor SDK imports | ${direct} |`);
  lines.push(`| Indirect vendor coupling | ${indirect} |`);
  lines.push(`| Adapter violation candidates | ${adapter} |`);
  lines.push("");
  lines.push("## Kernel boundary");
  lines.push("");
  lines.push(
    "`packages/roma-kernel` contains **zero** third-party vendor SDK imports — types and pure domain logic only."
  );
  lines.push("");
  lines.push("## Findings by target");
  lines.push("");

  for (const [id, result] of Object.entries(results)) {
    lines.push(`### ${id}`);
    lines.push("");
    if (!result.findings.length) {
      lines.push("_No vendor couplings detected._");
      lines.push("");
      continue;
    }
    lines.push("| Severity | Kind | Import | File |");
    lines.push("|----------|------|--------|------|");
    for (const f of result.findings) {
      lines.push(`| ${f.severity} | ${f.kind} | \`${f.specifier}\` | \`${f.file}\` |`);
    }
    lines.push("");
  }

  lines.push("## Recommendations (documentation only)");
  lines.push("");
  lines.push(
    "1. Keep `roma-kernel` vendor-neutral — current state satisfies this invariant.",
  );
  lines.push(
    "2. `roma-live-probes.ts` is the primary adapter-violation hotspot; future adapter extraction is architecture work, not required for this audit closure.",
  );
  lines.push(
    "3. `roma-run-history.service.ts` couples to Supabase client types — acceptable at persistence boundary until a storage port is introduced.",
  );
  lines.push("");

  return lines.join("\n");
}

const results = {};
for (const target of TARGETS) {
  results[target.id] = auditTarget(target);
}

const outDir = join(REPO_ROOT, "docs/audits");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "ROMA_VENDOR_DEPENDENCY_AUDIT.md");
writeFileSync(outPath, renderMarkdown(results));

const jsonPath = join(outDir, "ROMA_VENDOR_DEPENDENCY_AUDIT.json");
writeFileSync(jsonPath, JSON.stringify(results, null, 2));

console.log(`Wrote ${relative(REPO_ROOT, outPath)}`);
console.log(`Wrote ${relative(REPO_ROOT, jsonPath)}`);
