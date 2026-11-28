const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validateDependabot } = require("./validate-dependabot.cjs");

const manifest = {
  packageManager: "bun@1.2.15",
  workspaces: ["apps/web", "packages/contracts"],
};
const bun = { "package-ecosystem": "bun", directory: "/", schedule: { interval: "weekly" } };
const check = (updates, overrides = {}) => validateDependabot({
  configText: JSON.stringify({ version: 2, updates }),
  manifest,
  hasBunLock: true,
  ...overrides,
});

test("Bun root plus Actions and Gradle remains valid", () => {
  assert.deepEqual(check([
    bun,
    { "package-ecosystem": "github-actions", directory: "/" },
    { "package-ecosystem": "gradle", directory: "/android" },
  ]), []);
});

test("rejects the npm root configuration that caused misconfigured_tooling", () => {
  assert.match(check([{ ...bun, "package-ecosystem": "npm" }]).join("\n"), /npm updater at \/ overlaps/);
});

for (const directory of ["/.", "/apps/web", "/packages/contracts", "/packages/*", "/**"]) {
  test(`rejects a second npm updater overlapping the workspace at ${directory}`, () => {
    assert.match(check([bun, { "package-ecosystem": "npm", directory }]).join("\n"), /overlaps the Bun workspace/);
  });
}

test("accepts normalized root in directories while keeping unrelated npm projects possible", () => {
  assert.deepEqual(check([
    { "package-ecosystem": "bun", directories: ["/."] },
    { "package-ecosystem": "npm", directory: "/independent-tool" },
  ]), []);
});

test("requires exactly one root Bun updater for the default branch", () => {
  for (const updates of [[], [bun, bun], [{ ...bun, "target-branch": "other" }]]) {
    assert.match(check(updates).join("\n"), /Exactly one default-branch Bun updater/);
  }
});

test("rejects missing lock or a conflicting declared package manager", () => {
  assert.match(check([bun], { hasBunLock: false }).join("\n"), /bun.lock is missing/);
  assert.match(check([bun], { manifest: { ...manifest, packageManager: "npm@11" } }).join("\n"), /packageManager/);
});

test("does not accept malformed YAML, duplicate keys, or an invalid updates shape", () => {
  for (const configText of ["updates: [", "version: 2\nversion: 2\nupdates: []", "version: 2\nupdates: nope"]) {
    assert.ok(check([], { configText }).length > 0);
  }
});

test("parses normal YAML rather than matching comments or formatting", () => {
  assert.deepEqual(check([], { configText: `
# package-ecosystem: npm is a comment, not an updater.
version: 2
updates:
  - schedule: { interval: weekly }
    directory: '/'
    package-ecosystem: "bun"
` }), []);
});
