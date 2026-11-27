"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { checkLockfiles, parseBunLock } = require("./validate-known-vulnerabilities.cjs");
const snapshot = require("./known-vulnerabilities.json");

function fixtures() {
  return {
    snapshot,
    bunLock: { lockfileVersion: 1, packages: { zod: ["zod@4.6.6", "", {}] } },
    npmLock: { lockfileVersion: 3, packages: { "node_modules/zod": { version: "4.6.6" } } },
  };
}

test("patched versions pass both independently checked lockfiles", () => {
  const result = checkLockfiles(fixtures());
  assert.deepEqual(result.findings, []);
  assert.equal(result.policyPackages, 23);
});

test("an affected Bun version fails even when the npm shadow lock is patched", () => {
  const input = fixtures();
  input.bunLock.packages.zod[0] = "zod@3.25.76";
  const result = checkLockfiles(input);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].manager, "bun");
});

test("an affected npm version fails even when canonical Bun is patched", () => {
  const input = fixtures();
  input.npmLock.packages["node_modules/zod"].version = "4.6.5";
  const result = checkLockfiles(input);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].manager, "npm");
});

test("nested versions and scoped package aliases cannot hide behind a patched top-level version", () => {
  const input = fixtures();
  input.bunLock.packages["parent/alias"] = ["@vitest/mocker@4.1.11", "", {}];
  input.npmLock.packages["node_modules/parent/node_modules/alias"] = { name: "@vitest/mocker", version: "4.1.11" };
  assert.deepEqual(checkLockfiles(input).findings.map(({ name, manager }) => ({ name, manager })), [
    { name: "@vitest/mocker", manager: "bun" },
    { name: "@vitest/mocker", manager: "npm" },
  ]);
});

test("the mailed minimatch 3 vulnerability remains covered outside the npm audit ranges", () => {
  const input = fixtures();
  input.bunLock.packages.minimatch = ["minimatch@3.1.3", "", {}];
  assert.equal(checkLockfiles(input).findings.length, 1);
  input.bunLock.packages.minimatch[0] = "minimatch@3.1.4";
  assert.deepEqual(checkLockfiles(input).findings, []);
});

test("both patched undici major lines pass while nested vulnerable versions fail", () => {
  const input = fixtures();
  input.bunLock.packages.undici = ["undici@8.12.2", "", {}];
  input.bunLock.packages["miniflare/undici"] = ["undici@7.30.1", "", {}];
  assert.deepEqual(checkLockfiles(input).findings, []);
  input.bunLock.packages["miniflare/undici"][0] = "undici@7.30.0";
  assert.equal(checkLockfiles(input).findings.length, 1);
});

test("a release candidate before the patched version is not treated as patched", () => {
  const input = fixtures();
  input.bunLock.packages.zod[0] = "zod@4.6.6-rc.1";
  assert.equal(checkLockfiles(input).findings.length, 1);
});

test("Bun comments and trailing commas parse without executing JavaScript", () => {
  const input = fixtures();
  input.bunLock = parseBunLock('{ // fixture\n "lockfileVersion": 1, "packages": {"zod": ["zod@4.6.6", "", {},],},}');
  assert.deepEqual(checkLockfiles(input).findings, []);
  assert.throws(() => parseBunLock('{"packages": process.exit(0)}'));
});

test("linked application workspaces are not mistaken for registry dependencies", () => {
  const input = fixtures();
  input.bunLock.packages["@aistroyka/contracts"] = ["@aistroyka/contracts@workspace:packages/contracts"];
  input.npmLock.packages["node_modules/@aistroyka/contracts"] = { link: true, resolved: "packages/contracts" };
  assert.deepEqual(checkLockfiles(input).findings, []);
});

test("unverifiable versions of a known affected package fail closed", () => {
  const input = fixtures();
  input.npmLock.packages["node_modules/zod"] = {};
  assert.throws(() => checkLockfiles(input), /Cannot verify known package zod/);
  input.npmLock = fixtures().npmLock;
  input.bunLock.packages.zod[0] = "zod@git:unverified-fork";
  assert.throws(() => checkLockfiles(input), /Cannot verify known package zod/);
});

test("a git URL containing an @ sign cannot hide a known Bun package identity", () => {
  for (const name of ["zod", "@vitest/mocker"]) {
    const input = fixtures();
    input.bunLock.packages.fork = [`${name}@git+ssh://git@github.com/example/repository.git#unverified`];
    assert.throws(() => checkLockfiles(input), /Cannot verify known package/);
  }
});

test("a linked known npm package cannot substitute for a verified registry release", () => {
  const input = fixtures();
  input.npmLock.packages["node_modules/fork"] = {
    name: "zod", link: true, resolved: "../unverified-fork", version: "4.6.6",
  };
  assert.throws(() => checkLockfiles(input), /Cannot verify known package zod/);
});

test("malformed policy and npm package identities are rejected instead of skipped", () => {
  const input = fixtures();
  input.snapshot = { ...snapshot, advisories: [{ package: "zod ", affected: "<4.6.6", source: "fixture" }] };
  assert.throws(() => checkLockfiles(input), /Invalid package, affected range/);
  input.snapshot = snapshot;
  input.npmLock.packages["node_modules/zod"].name = {};
  assert.throws(() => checkLockfiles(input), /Invalid npm package name/);
});

test("empty locks and malformed policy ranges cannot silently produce a green check", () => {
  const input = fixtures();
  input.bunLock.packages = {};
  assert.throws(() => checkLockfiles(input), /nonempty Bun/);
  input.bunLock = fixtures().bunLock;
  input.npmLock.packages = {};
  assert.throws(() => checkLockfiles(input), /nonempty npm/);
  input.npmLock = fixtures().npmLock;
  input.snapshot = { ...snapshot, advisories: [] };
  assert.throws(() => checkLockfiles(input), /empty known-advisory/);
  input.snapshot = { ...snapshot, advisories: [{ package: "zod", affected: "not a range", source: "fixture" }] };
  assert.throws(() => checkLockfiles(input), /Invalid package, affected range/);
});
