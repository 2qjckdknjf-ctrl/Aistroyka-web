#!/usr/bin/env node
/**
 * Fails if raw Tailwind color classes are used in app/components/lib.
 * Use aistroyka tokens only. Excludes: node_modules, .next, *.test.*, *.spec.*, docs.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { findRawColorClasses, runRawColorPatternSelfTest } from "./raw-color-pattern.mjs";

const ROOT = process.cwd();

const excludeDir = (name) =>
  name === "node_modules" || name === ".next" || name.startsWith(".");
const excludeFile = (name) =>
  /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(name) ||
  name.endsWith(".d.ts") ||
  name.includes("docs/");

function walk(dir, base = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory() && !excludeDir(e.name)) {
      files.push(...walk(join(dir, e.name), rel));
    } else if (
      e.isFile() &&
      /\.(tsx?|jsx?|css)$/.test(e.name) &&
      !excludeFile(rel)
    ) {
      files.push(join(dir, e.name));
    }
  }
  return files;
}

function runSelfTest() {
  const { ok, failures } = runRawColorPatternSelfTest();
  if (!ok) {
    console.error("check-raw-colors self-test FAILED:\n");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("check-raw-colors self-test: PASS");
}

function scanSourceTree() {
  const dirs = ["app", "components", "lib"].map((d) => join(ROOT, d));
  const allFiles = [];
  for (const d of dirs) {
    try {
      allFiles.push(...walk(d));
    } catch (_) {
      // dir may not exist
    }
  }

  let failed = false;
  const report = [];

  for (const file of allFiles) {
    const content = readFileSync(file, "utf8");
    const rel = file.replace(ROOT + "/", "");
    const matches = findRawColorClasses(content);
    if (matches.length) {
      failed = true;
      report.push({ file: rel, classes: matches });
    }
  }

  if (report.length) {
    console.error("Raw Tailwind colors are not allowed. Use aistroyka tokens.\n");
    for (const { file, classes } of report) {
      console.error(`  ${file}: ${classes.join(", ")}`);
    }
    console.error("\nRun: grep -rn 'slate-\\|red-\\|amber-\\|emerald-' app components lib");
    process.exit(1);
  }

  console.log("check-raw-colors: no raw color classes found.");
}

const args = process.argv.slice(2);
const selfTestOnly = args.includes("--self-test");
const skipSelfTest = args.includes("--skip-self-test");

if (selfTestOnly) {
  runSelfTest();
  process.exit(0);
}

if (!skipSelfTest) {
  runSelfTest();
}
scanSourceTree();
