#!/usr/bin/env node
/**
 * Discover app routes and API endpoints for QA self-audit.
 * Run: node scripts/qa/route-discovery.mjs
 */
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "../..");
const appsWeb = join(root, "apps/web");
const appDir = join(appsWeb, "app");
const outDir = join(root, "docs/qa/discovered");

function walk(dir, filter) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...walk(full, filter));
    } else if (filter(full)) {
      results.push(full);
    }
  }
  return results;
}

function pageRouteFromFile(file) {
  let rel = relative(appDir, file).replace(/\\/g, "/");
  rel = rel.replace(/\/page\.tsx$/, "");
  rel = rel.replace(/^app\//, "");
  // route groups
  rel = rel.replace(/\([^)]+\)\//g, "");
  rel = rel.replace(/\[locale\]\/?/, "");
  if (rel === "page.tsx" || rel === "") return "/[locale]";
  return `/${rel}`;
}

function apiRouteFromFile(file) {
  let rel = relative(join(appsWeb, "app/api"), file).replace(/\\/g, "/");
  rel = rel.replace(/\/route\.ts$/, "");
  return `/api/${rel}`;
}

const pages = walk(appDir, (f) => f.endsWith("/page.tsx") || f.endsWith("\\page.tsx"));
const apis = walk(join(appsWeb, "app/api"), (f) => f.endsWith("/route.ts") || f.endsWith("\\route.ts"));

const pageRoutes = [...new Set(pages.map(pageRouteFromFile))].sort();
const apiRoutes = [...new Set(apis.map(apiRouteFromFile))].sort();

const qaSpecs = walk(join(appsWeb, "tests/qa"), (f) => f.endsWith(".spec.ts"));
const e2eSpecs = walk(join(appsWeb, "tests/e2e"), (f) => f.endsWith(".spec.ts"));

mkdirSync(outDir, { recursive: true });
const discovery = {
  generatedAt: new Date().toISOString(),
  counts: { pages: pageRoutes.length, apis: apiRoutes.length, qaSpecs: qaSpecs.length, e2eSpecs: e2eSpecs.length },
  pageRoutes,
  apiRoutes,
  qaSpecFiles: qaSpecs.map((f) => relative(root, f)),
  e2eSpecFiles: e2eSpecs.map((f) => relative(root, f)),
};

writeFileSync(join(outDir, "routes.json"), JSON.stringify(discovery, null, 2));
console.log(`Discovered ${pageRoutes.length} pages, ${apiRoutes.length} APIs → docs/qa/discovered/routes.json`);
