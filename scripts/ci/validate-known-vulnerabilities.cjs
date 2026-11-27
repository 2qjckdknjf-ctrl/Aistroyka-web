#!/usr/bin/env node
"use strict";

// Offline regression guard for the dated, reviewed advisory snapshot beside this file.
// No network requests, package installation, or inventory transmission occur here.
const fs = require("node:fs");
const path = require("node:path");
const semver = require("semver");
const commentJson = require("comment-json");

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function packageName(value) {
  return typeof value === "string" && /^(?:@[A-Za-z0-9._~-]+\/)?[A-Za-z0-9._~-]+$/.test(value);
}

function parseBunLock(text) {
  return commentJson.parse(text, null, true);
}

function advisoryIndex(snapshot) {
  if (snapshot?.schemaVersion !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.capturedAt ?? "") ||
      !Array.isArray(snapshot.advisories) || snapshot.advisories.length === 0) {
    throw new Error("Invalid or empty known-advisory snapshot");
  }
  const index = new Map();
  for (const advisory of snapshot.advisories) {
    if (!object(advisory) || !packageName(advisory.package) ||
        typeof advisory.affected !== "string" || !advisory.affected.trim() ||
        !semver.validRange(advisory.affected) || typeof advisory.source !== "string" || !advisory.source) {
      throw new Error("Invalid package, affected range, or source in known-advisory snapshot");
    }
    const entries = index.get(advisory.package) ?? [];
    entries.push(advisory);
    index.set(advisory.package, entries);
  }
  return index;
}

function bunPackages(lock) {
  if (lock?.lockfileVersion !== 1 || !object(lock.packages) || Object.keys(lock.packages).length === 0) {
    throw new Error("Expected a nonempty Bun 1 text lockfile");
  }
  return Object.entries(lock.packages).map(([location, entry]) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") {
      throw new Error(`Invalid Bun package entry: ${location}`);
    }
    // The tuple's descriptor identifies the real package even for nested/scoped aliases.
    // A git URL may itself contain git@host: split at the package/version separator.
    const at = entry[0].indexOf("@", entry[0].startsWith("@") ? 1 : 0);
    if (at <= 0 || at === entry[0].length - 1) throw new Error(`Invalid Bun package descriptor: ${location}`);
    const name = entry[0].slice(0, at);
    if (!packageName(name)) throw new Error(`Invalid Bun package name: ${location}`);
    return { manager: "bun", location, name, version: entry[0].slice(at + 1) };
  });
}

function npmPackages(lock) {
  if (lock?.lockfileVersion !== 3 || !object(lock.packages) || Object.keys(lock.packages).length === 0) {
    throw new Error("Expected a nonempty npm v3 package lockfile");
  }
  const entries = [];
  for (const [location, entry] of Object.entries(lock.packages)) {
    const marker = location.lastIndexOf("node_modules/");
    if (marker < 0) continue; // Root/workspace manifests are not installed registry packages.
    if (!object(entry)) throw new Error(`Invalid npm package entry: ${location}`);
    const name = entry.name === undefined ? location.slice(marker + "node_modules/".length) : entry.name;
    if (!packageName(name)) throw new Error(`Invalid npm package name: ${location}`);
    entries.push({
      manager: "npm", location, name, version: entry.version, linked: entry.link === true,
    });
  }
  if (!entries.some((entry) => !entry.linked)) throw new Error("npm lockfile contains no registry package entries");
  return entries;
}

function checkLockfiles({ bunLock, npmLock, snapshot }) {
  const index = advisoryIndex(snapshot);
  const packages = [...bunPackages(bunLock), ...npmPackages(npmLock)];
  const findings = [];
  for (const entry of packages) {
    const advisories = index.get(entry.name);
    if (!advisories) continue;
    if (entry.linked || typeof entry.version !== "string" || !semver.valid(entry.version)) {
      throw new Error(`Cannot verify known package ${entry.name} at ${entry.manager}:${entry.location}: linked, missing, or non-registry version`);
    }
    const matches = advisories.filter((advisory) =>
      semver.satisfies(entry.version, advisory.affected, { includePrerelease: true }));
    if (matches.length) findings.push({ ...entry, advisories: matches });
  }
  return { findings, checkedEntries: packages.length, policyPackages: index.size };
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, "../..");
    const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, "known-vulnerabilities.json"), "utf8"));
    const result = checkLockfiles({
      bunLock: parseBunLock(fs.readFileSync(path.join(root, "bun.lock"), "utf8")),
      npmLock: JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8")),
      snapshot,
    });
    for (const entry of result.findings) {
      const sources = [...new Set(entry.advisories.map((advisory) => advisory.source))];
      console.error(`${entry.manager}:${entry.location}: ${entry.name}@${entry.version} matches known affected ranges (${sources[0]})`);
    }
    if (result.findings.length) {
      throw new Error(`${result.findings.length} vulnerable lock entries match the ${snapshot.capturedAt} advisory snapshot`);
    }
    console.log(`Known-advisory guard passed: ${result.checkedEntries} lock entries; ${result.policyPackages} package policies as of ${snapshot.capturedAt}. Offline snapshot, not a current advisory audit.`);
  } catch (error) {
    console.error(`Known-advisory guard failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { checkLockfiles, parseBunLock };
