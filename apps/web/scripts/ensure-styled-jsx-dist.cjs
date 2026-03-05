/**
 * OpenNext bundles from .open-next/node_modules; styled-jsx there has
 * index.js that requires('./dist/index') but the copied package can miss dist.
 * Ensure apps/web/node_modules/styled-jsx/dist exists by copying from root
 * node_modules (monorepo hoists full package there). Run before opennext build.
 */
const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(appDir, "..", "..");
const target = path.join(appDir, "node_modules", "styled-jsx", "dist");
const source = path.join(rootDir, "node_modules", "styled-jsx", "dist");

if (!fs.existsSync(source)) {
  console.warn("[ensure-styled-jsx-dist] Root styled-jsx/dist not found, skipping.");
  process.exit(0);
}
if (fs.existsSync(target)) {
  console.log("[ensure-styled-jsx-dist] styled-jsx/dist already present in app.");
  process.exit(0);
}

const pkgDir = path.join(appDir, "node_modules", "styled-jsx");
if (!fs.existsSync(pkgDir)) {
  console.warn("[ensure-styled-jsx-dist] App styled-jsx not found, skipping.");
  process.exit(0);
}

fs.cpSync(source, target, { recursive: true });
console.log("[ensure-styled-jsx-dist] Copied styled-jsx/dist from root to app.");
