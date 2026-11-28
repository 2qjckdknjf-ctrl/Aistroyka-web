#!/usr/bin/env node
/** Keep Dependabot aligned with the canonical Bun workspace, before updater jobs run. */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

// Both parsers are declared dependencies of the already-installed, locked ESLint.
// Resolve from that package rather than depending on workspace hoisting.
const requireEslint = createRequire(require.resolve("eslint/package.json"));
const yaml = requireEslint("js-yaml");
const minimatch = requireEslint("minimatch");

function validateDependabot({ configText, manifest, hasBunLock }) {
  const errors = [];
  if (!hasBunLock) errors.push("The canonical root bun.lock is missing.");
  if (!/^bun@/.test(manifest.packageManager ?? "")) {
    errors.push("package.json must declare the canonical Bun packageManager.");
  }
  let config;
  try {
    config = yaml.load(configText);
  } catch (error) {
    return [...errors, `Invalid Dependabot YAML: ${error.message}`];
  }
  if (config?.version !== 2 || !Array.isArray(config.updates)) {
    return [...errors, "Dependabot must use version: 2 with an updates list."];
  }

  const workspaces = Array.isArray(manifest.workspaces)
    ? manifest.workspaces
    : manifest.workspaces?.packages ?? [];
  const workspaceDirs = ["/", ...workspaces.map((dir) => path.posix.resolve("/", dir))];
  let rootBunEntries = 0;
  for (const update of config.updates) {
    const targets = update?.directories ?? [update?.directory];
    if (!Array.isArray(targets) || targets.some((dir) => typeof dir !== "string")) {
      errors.push("Every Dependabot update must specify directory or directories.");
      continue;
    }
    const dirs = targets.map((dir) => path.posix.resolve("/", dir));
    if (update["package-ecosystem"] === "bun" && !update["target-branch"]) {
      rootBunEntries += dirs.filter((dir) => dir === "/").length;
    }
    if (update["package-ecosystem"] === "npm") {
      for (const dir of dirs) {
        if (workspaceDirs.some((workspace) =>
          minimatch(workspace, dir, { dot: true }) || minimatch(dir, workspace, { dot: true })
        )) {
          errors.push(`npm updater at ${dir} overlaps the Bun workspace; use package-ecosystem: bun at /.`);
        }
      }
    }
  }
  if (rootBunEntries !== 1) {
    errors.push("Exactly one default-branch Bun updater must cover / (the canonical workspace bun.lock).");
  }
  return errors;
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] ?? path.join(__dirname, "../.."));
  const errors = validateDependabot({
    configText: fs.readFileSync(path.join(root, ".github/dependabot.yml"), "utf8"),
    manifest: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")),
    hasBunLock: fs.existsSync(path.join(root, "bun.lock")),
  });
  if (errors.length) {
    console.error(`Dependabot configuration is incompatible with the Bun workspace:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Dependabot configuration matches the canonical Bun workspace.");
  }
}

module.exports = { validateDependabot };
