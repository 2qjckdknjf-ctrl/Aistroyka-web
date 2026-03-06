/**
 * When using outputFileTracingRoot (monorepo), Next.js emits
 * .next/standalone/apps/web/.next/... but OpenNext looks for
 * .next/standalone/.next/... Create a symlink so both paths work.
 * Run after `next build`, before or during OpenNext bundle step.
 */
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(appDir, ".next", "standalone");
const nestedNext = path.join(standaloneDir, "apps", "web", ".next");
const linkPath = path.join(standaloneDir, ".next");

if (!fs.existsSync(nestedNext)) {
  process.exit(0);
}
if (fs.existsSync(linkPath)) {
  try {
    fs.rmSync(linkPath, { recursive: true });
  } catch (_) {}
}
fs.symlinkSync(path.relative(standaloneDir, nestedNext), linkPath);
console.log("[apps/web] Linked .next/standalone/.next for OpenNext.");
