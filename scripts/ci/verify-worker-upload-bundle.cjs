#!/usr/bin/env node
// Exercise the pinned upload packager locally; never upload or deploy a Worker.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function verifyBundle(directory) {
  const worker = path.join(directory, "worker-bootstrap.js");
  assert.ok(fs.statSync(worker).size > 0, "Worker JavaScript bundle is missing or empty");
  function checkMaps(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) checkMaps(path.join(current, entry.name));
      else assert.ok(!entry.name.endsWith(".map"), `Unexpected source map: ${entry.name}`);
    }
  }
  checkMaps(directory);
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const directory = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), "aistroyka-worker-upload-"));
  try {
    const result = spawnSync(process.execPath, [
      path.join(root, "node_modules/wrangler/bin/wrangler.js"),
      "deploy", "--dry-run", "--env", "production", "--config", "wrangler.toml",
      "--outdir", directory,
    ], {
      cwd: path.join(root, "apps/web"),
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      stdio: "inherit",
      timeout: 120_000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, "Worker dry-run packaging failed");
    verifyBundle(directory);
    console.log("Worker upload packaging passed: JavaScript present; prior source-map upload policy preserved.");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verifyBundle };
