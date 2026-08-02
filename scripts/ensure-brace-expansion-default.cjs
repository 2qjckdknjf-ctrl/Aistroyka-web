/**
 * Ensure brace-expansion@5 provides a default export for minimatch@8 ESM
 * (OpenNext @node-minify). Works for both Bun and npm install paths —
 * Bun patchedDependencies alone is not applied by npm/Vercel.
 *
 * Safe/idempotent: skips when default export already present.
 */
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");

function collectBraceExpansionRoots() {
  const roots = new Set();

  const candidates = [
    path.join(REPO_ROOT, "node_modules", "brace-expansion"),
    path.join(
      REPO_ROOT,
      "node_modules",
      "@node-minify",
      "core",
      "node_modules",
      "brace-expansion"
    ),
    path.join(
      REPO_ROOT,
      "node_modules",
      "@node-minify",
      "core",
      "node_modules",
      "glob",
      "node_modules",
      "brace-expansion"
    ),
  ];

  try {
    const resolved = require.resolve("brace-expansion/package.json", {
      paths: [REPO_ROOT, path.join(REPO_ROOT, "apps", "web")],
    });
    candidates.push(path.dirname(resolved));
  } catch {
    // not hoisted yet
  }

  for (const dir of candidates) {
    const pkgPath = path.join(dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.name === "brace-expansion" && String(pkg.version).startsWith("5.")) {
        roots.add(dir);
      }
    } catch {
      // ignore invalid package.json
    }
  }

  return [...roots];
}

function patchRoot(root) {
  const esm = path.join(root, "dist", "esm", "index.js");
  const cjs = path.join(root, "dist", "commonjs", "index.js");
  let changed = false;

  if (fs.existsSync(esm)) {
    let src = fs.readFileSync(esm, "utf8");
    if (!src.includes("export default expand")) {
      src = `${src.replace(/\s*$/, "")}\nexport default expand;\n`;
      fs.writeFileSync(esm, src);
      changed = true;
    }
  }

  if (fs.existsSync(cjs)) {
    let src = fs.readFileSync(cjs, "utf8");
    if (!src.includes("exports.default = expand")) {
      src =
        `${src.replace(/\s*$/, "")}\n` +
        "exports.default = expand;\n" +
        "module.exports = Object.assign(expand, exports);\n";
      fs.writeFileSync(cjs, src);
      changed = true;
    }
  }

  return changed;
}

function main() {
  const roots = collectBraceExpansionRoots();
  if (!roots.length) {
    console.log("ensure-brace-expansion-default: no brace-expansion@5 found (skip)");
    return;
  }
  let patched = 0;
  for (const root of roots) {
    if (patchRoot(root)) patched += 1;
  }
  console.log(
    `ensure-brace-expansion-default: checked ${roots.length} install(s), patched ${patched}`
  );
}

main();
