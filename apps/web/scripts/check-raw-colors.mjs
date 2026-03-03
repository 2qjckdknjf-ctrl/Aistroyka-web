#!/usr/bin/env node
/**
 * Fails if raw Tailwind color classes are used in app/components/lib.
 * Use aistroyka tokens only. Excludes: node_modules, .next, *.test.*, *.spec.*, docs.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FORBIDDEN =
  /(?:^|\s)(?:text|bg|border|ring|from|to|via|divide|placeholder|ring)-((?:slate|red|amber|emerald|gray|zinc|neutral|stone|orange|yellow|lime|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+)/g;

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
  let m;
  FORBIDDEN.lastIndex = 0;
  const matches = [];
  while ((m = FORBIDDEN.exec(content)) !== null) {
    matches.push(m[1]);
  }
  if (matches.length) {
    failed = true;
    report.push({ file: rel, classes: [...new Set(matches)] });
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
