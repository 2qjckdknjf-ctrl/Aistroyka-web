#!/usr/bin/env node
/** CI: reject empty converted schemas and broken document-root references. */
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "dist", "openapi.json");
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
assert.equal(spec.openapi, "3.0.3", "The generated document must retain OpenAPI 3.0");

const schemas = spec.components?.schemas;
const objectSchemas = [
  "HealthResponse", "AnalyzeImageRequest", "AnalysisResult", "AnalyzeImageError",
  "Project", "ProjectsListResponse", "CreateProjectRequest", "CreateProjectResponse",
  "TenantMember", "TenantMembersResponse", "TenantLimits", "SyncBootstrapResponse",
  "SyncChangeEntry", "SyncChangesResponse", "SyncAckRequest", "SyncAckResponse", "ConfigPayload",
];
for (const name of objectSchemas) {
  assert.equal(schemas?.[name]?.type, "object", `${name} must be a usable object schema`);
  assert.ok(Object.keys(schemas[name].properties ?? {}).length > 0, `${name} lost its properties`);
}
assert.deepEqual(schemas.SubscriptionTier.enum, ["FREE", "PRO", "ENTERPRISE"]);
assert.equal(schemas.SubscriptionTier.type, "string");
assert.ok(schemas.AnalyzeImageRequest.required.includes("image_url"));
assert.ok(!schemas.AnalyzeImageRequest.required.includes("project_id"));
assert.equal(schemas.CreateProjectRequest.properties.name.minLength, 1);
assert.equal(schemas.CreateProjectRequest.properties.name.maxLength, 200);
assert.equal(schemas.TenantMember.properties.user_id.format, "uuid");
assert.equal(schemas.SyncChangeEntry.properties.payload.type, "object");
assert.equal(schemas.SyncChangesResponse.properties.data.properties.changes.type, "array");
assert.equal(schemas.ConfigPayload.properties.flags.additionalProperties.properties.enabled.type, "boolean");

// Component schemas are nested in the document; legacy converter-local
// #/definitions references must not silently point outside that document root.
function verifyReferences(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") {
    assert.ok(value.$ref.startsWith("#/"), `Unexpected external schema reference: ${value.$ref}`);
    const target = value.$ref.slice(2).split("/").reduce((node, part) => {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      return node && Object.hasOwn(node, key) ? node[key] : undefined;
    }, spec);
    assert.ok(target && typeof target === "object", `Unresolved schema reference: ${value.$ref}`);
  }
  for (const child of Object.values(value)) verifyReferences(child);
}
verifyReferences(spec);
console.log("openapi.json valid");
process.exit(0);
