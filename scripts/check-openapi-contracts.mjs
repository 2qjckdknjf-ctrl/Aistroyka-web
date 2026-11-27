#!/usr/bin/env node
// After build:contracts, exercise both supported generators without overwriting tracked specs.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bun = process.versions.bun ? process.execPath : "bun";
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "aistroyka-openapi-"));
const packages = ["packages/contracts-openapi", "docs/_archive/packages-contracts-openapi"];

function run(args, cwd) {
  const result = spawnSync(bun, args, { cwd, encoding: "utf8", timeout: 30_000 });
  assert.ifError(result.error);
  assert.notEqual(result.status, null, "OpenAPI command did not exit normally");
  return result;
}

try {
  for (const [index, packagePath] of packages.entries()) {
    const cwd = path.join(temporaryRoot, String(index));
    mkdirSync(path.join(cwd, "dist"), { recursive: true });
    const generator = path.join(root, packagePath, "build-openapi.ts");
    const validator = path.join(root, packagePath, "validate-openapi.mjs");
    const generated = path.join(cwd, "dist", "openapi.json");
    const build = run([generator], cwd);
    assert.equal(build.status, 0, `${packagePath}: ${build.stderr}`);
    const valid = run([validator, generated], cwd);
    assert.equal(valid.status, 0, `${packagePath}: ${valid.stderr}`);
    const spec = JSON.parse(readFileSync(generated, "utf8"));

    // These reproduce legacy converter regressions that a nonempty paths check misses.
    const empty = structuredClone(spec);
    empty.components.schemas.AnalyzeImageRequest = {};
    const dangling = structuredClone(spec);
    dangling.components.schemas.HealthResponse.properties.regression = {
      $ref: "#/definitions/NonexistentSchema",
    };
    for (const [name, invalidSpec, expected] of [
      ["empty", empty, /AnalyzeImageRequest must be a usable object schema/],
      ["dangling", dangling, /Unresolved schema reference/],
    ]) {
      const file = path.join(cwd, `${name}.json`);
      writeFileSync(file, JSON.stringify(invalidSpec));
      const invalid = run([validator, file], cwd);
      assert.notEqual(invalid.status, 0, `${packagePath} accepted a ${name} schema`);
      assert.match(invalid.stderr, expected);
    }
    console.log(`${packagePath}: generated schema valid; empty/dangling schemas rejected`);
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
