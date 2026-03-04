#!/usr/bin/env node
/** CI: validate dist/openapi.json exists and has required structure. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "dist", "openapi.json");
if (!fs.existsSync(file)) {
  console.error("Missing dist/openapi.json. Run npm run build.");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(file, "utf-8"));
if (!spec.openapi || !spec.info || !spec.paths || typeof spec.paths !== "object") {
  console.error("Invalid openapi.json: need openapi, info, paths.");
  process.exit(1);
}
if (Object.keys(spec.paths).length < 5) {
  console.error("openapi.json should have at least 5 paths.");
  process.exit(1);
}
console.log("openapi.json valid");
process.exit(0);
