/**
 * In a Bun monorepo, apps/web can get a pruned Next.js (missing dist/shared),
 * which breaks the build. If the root has a full Next.js, symlink it here.
 * Run from apps/web (package.json postinstall).
 */
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const localNext = path.join(appDir, "node_modules", "next");
const rootNext = path.join(appDir, "..", "..", "node_modules", "next");

const localHasShared = fs.existsSync(path.join(localNext, "dist", "shared"));
const rootHasShared = fs.existsSync(path.join(rootNext, "dist", "shared"));

if (!localHasShared && rootHasShared && fs.existsSync(rootNext)) {
  try {
    fs.rmSync(localNext, { recursive: true });
    fs.symlinkSync(path.relative(path.dirname(localNext), rootNext), localNext);
    console.log("[apps/web] Linked next to root (monorepo full package).");
  } catch (e) {
    console.warn("[apps/web] Could not link next:", e.message);
  }
}
