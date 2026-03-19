/**
 * Step 9B — Ensure SWC native bindings on darwin-x64.
 * Bun install can leave @next/swc-darwin-x64 and @swc/core-darwin-x64
 * without their .node binaries; this script reinstalls them with npm when missing.
 * No-op on other platforms or when binaries already exist.
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const isDarwinX64 =
  process.platform === "darwin" && process.arch === "x64";

if (!isDarwinX64) {
  process.exit(0);
}

function needsNextSwc() {
  const dir = path.join(root, "node_modules", "@next", "swc-darwin-x64");
  const bin = path.join(dir, "next-swc.darwin-x64.node");
  return fs.existsSync(dir) && !fs.existsSync(bin);
}

function needsSwcCore() {
  const dir = path.join(root, "node_modules", "@swc", "core-darwin-x64");
  const bin = path.join(dir, "swc.darwin-x64.node");
  return fs.existsSync(dir) && !fs.existsSync(bin);
}

function getNextVersion() {
  try {
    const p = path.join(root, "node_modules", "next", "package.json");
    return JSON.parse(fs.readFileSync(p, "utf8")).version;
  } catch {
    return null;
  }
}

function getSwcCoreVersion() {
  try {
    const p = path.join(root, "node_modules", "@swc", "core", "package.json");
    return JSON.parse(fs.readFileSync(p, "utf8")).version;
  } catch {
    return null;
  }
}

let fixed = false;

if (needsNextSwc()) {
  const ver = getNextVersion();
  if (ver) {
    const r = spawnSync(
      "npm",
      ["install", `@next/swc-darwin-x64@${ver}`, "--no-save"],
      { cwd: root, stdio: "inherit", shell: true }
    );
    if (r.status === 0) fixed = true;
  }
}

if (needsSwcCore()) {
  const ver = getSwcCoreVersion();
  if (ver) {
    const r = spawnSync(
      "npm",
      ["install", `@swc/core-darwin-x64@${ver}`, "--no-save"],
      { cwd: root, stdio: "inherit", shell: true }
    );
    if (r.status === 0) fixed = true;
  }
}

process.exit(0);
