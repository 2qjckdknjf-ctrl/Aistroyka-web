#!/usr/bin/env node
/**
 * Validate the root package-lock.json for the Vercel npm install path.
 * CI builds with bun, so a broken npm lock is invisible here until Vercel
 * fails. Two known failure modes are checked:
 * 1. Package entries without a version (e.g. the apps/web/node_modules/next
 *    postinstall symlink recorded as {}) — they break `npm install` with
 *    "Invalid Version".
 * 2. Platform-specific optional binaries locked for a single OS (lock
 *    regenerated on macOS): linux-x64 builders then cannot load the module.
 */
const path = require("path");
const lockPath = path.join(__dirname, "..", "..", "package-lock.json");
const lock = require(lockPath);

const errors = [];

for (const [key, entry] of Object.entries(lock.packages ?? {})) {
  if (key === "" || entry.link) continue;
  if (!entry.version) {
    errors.push(
      `entry "${key}" has no version (likely a symlink recorded as a package; ` +
        `restore it as {"resolved": "...", "link": true} or regenerate the lock on linux)`
    );
  }
}

const multiPlatformPackages = [
  ["node_modules/@parcel/watcher", "node_modules/@parcel/watcher-linux-x64-glibc"],
];
for (const [pkg, linuxVariant] of multiPlatformPackages) {
  if (lock.packages?.[pkg] && !lock.packages?.[linuxVariant]) {
    errors.push(
      `"${pkg}" is locked without "${linuxVariant}" — the lock was likely ` +
        `regenerated on macOS and will break Vercel's linux build. ` +
        `Regenerate package-lock.json on linux (rm -rf node_modules package-lock.json && npm install).`
    );
  }
}

if (errors.length > 0) {
  console.error("package-lock.json is broken for the npm (Vercel) install path:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("package-lock.json OK for the npm (Vercel) install path.");
