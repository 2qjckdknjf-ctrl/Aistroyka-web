#!/usr/bin/env node
/**
 * Validate a pilot intake JSON file and print GO/NO-GO readiness.
 * Local only — does not send data anywhere.
 *
 * Usage:
 *   node scripts/pilot/validate_pilot_intake.mjs docs/launch/pilot-intake.example.json
 *   node scripts/pilot/validate_pilot_intake.mjs path/to/pilot-intake.local.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/pilot/validate_pilot_intake.mjs <intake.json>");
  process.exit(2);
}

/** @param {unknown} v */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/** @param {unknown} v */
function isTruthySignoff(v) {
  if (v === true) return true;
  if (isNonEmptyString(v)) return true;
  return false;
}

let data;
try {
  const raw = readFileSync(resolve(fileArg), "utf8");
  data = JSON.parse(raw);
} catch (e) {
  console.error(`Failed to read/parse intake JSON: ${e instanceof Error ? e.message : e}`);
  process.exit(2);
}

/** @type {string[]} */
const missing = [];
/** @type {string[]} */
const blockers = [];
/** @type {string[]} */
const warnings = [];

const client = data.client ?? {};
const project = data.project ?? {};
const users = data.users ?? {};
const devices = data.devices ?? {};
const scope = data.scope ?? {};
const environment = data.environment ?? {};
const support = data.support ?? {};
const day0 = data.day0Checklist ?? {};
const goNoGo = data.goNoGo ?? {};

// --- Launch-critical required fields ---
if (!isNonEmptyString(client.companyName)) {
  missing.push("client.companyName");
}
const sponsor = client.mainSponsor ?? {};
if (!isNonEmptyString(sponsor.name)) {
  missing.push("client.mainSponsor.name");
}
if (!isNonEmptyString(sponsor.email)) {
  missing.push("client.mainSponsor.email");
}
if (!isNonEmptyString(project.name)) {
  missing.push("project.name");
}
if (!isNonEmptyString(project.startDate)) {
  missing.push("project.startDate");
}

const hasSupportEmail = isNonEmptyString(support.supportEmail);
const hasSupportChannel =
  isNonEmptyString(support.supportWhatsAppTelegram) ||
  isNonEmptyString(support.supportOwner);
if (!hasSupportEmail && !hasSupportChannel) {
  missing.push("support.supportEmail (or support.supportWhatsAppTelegram / support.supportOwner)");
}

const managers = Array.isArray(users.managers) ? users.managers : [];
const workers = Array.isArray(users.workers) ? users.workers : [];
if (managers.length < 1) {
  missing.push("users.managers (at least one manager)");
}
if (workers.length < 1) {
  missing.push("users.workers (at least one worker)");
}

if (!isNonEmptyString(environment.target)) {
  missing.push("environment.target (staging | production)");
}

if (devices.androidOnlyWorkersConfirmed !== true) {
  missing.push("devices.androidOnlyWorkersConfirmed (must be true after operator confirms Android check)");
}

if (day0.knownLimitationsAccepted !== true) {
  missing.push("day0Checklist.knownLimitationsAccepted (must be true)");
}

const ownerSignoff =
  isTruthySignoff(goNoGo.ownerSignoff) || day0.ownerSignoff === true || isTruthySignoff(day0.ownerSignoff);
if (!ownerSignoff) {
  missing.push("goNoGo.ownerSignoff (or day0Checklist.ownerSignoff)");
}

// --- Android defer blocker ---
const androidScope = scope.androidSupport ?? {};
const androidIncluded = androidScope.included === true;
const anyWorkerAndroidOnly = workers.some((w) => w && w.androidOnly === true);
const androidOnlyFlag = devices.androidOnlyWorkers === true;

if ((androidOnlyFlag || anyWorkerAndroidOnly) && !androidIncluded) {
  blockers.push(
    "Android-only workers present but Android is deferred (scope.androidSupport.included is false). Provide iOS devices or owner-authorize Android Worker MVP.",
  );
}

// --- Production authorization blocker ---
const target = String(environment.target ?? "").toLowerCase();
const isProduction =
  target === "production" ||
  target === "production dedicated pilot tenant" ||
  target.includes("production");

if (isProduction && environment.productionMutationAuthorizedByOwner !== true) {
  blockers.push("Production pilot selected but owner production authorization is missing (environment.productionMutationAuthorizedByOwner must be true).");
}

// --- Warnings: Day 0 checklist items not done ---
const day0LaunchItems = [
  ["iosDevicesReady", "iOS devices ready"],
  ["testFlightInstalled", "TestFlight installed on devices"],
  ["tenantAccountCreated", "Tenant/account created"],
  ["projectCreated", "Project created"],
  ["managersInvited", "Managers invited"],
  ["workersInvited", "Workers invited"],
  ["workerReportMediaSmokePassed", "Worker report/media smoke"],
  ["managerApprovalSmokePassed", "Manager approval smoke"],
  ["clientSignoff", "Client signoff"],
];

for (const [key, label] of day0LaunchItems) {
  if (day0[key] !== true && day0[key] !== "true") {
    warnings.push(`Day 0 checklist not complete: ${label} (day0Checklist.${key})`);
  }
}

if (workers.length === 1) {
  warnings.push("Only one worker listed — recommend at least two for meaningful pilot.");
}

if (managers.some((m) => m && m.iphoneAvailable === false)) {
  warnings.push("Some managers marked without iPhone — web dashboard is primary path.");
}

// --- Scope required-for-launch items ---
for (const [key, item] of Object.entries(scope)) {
  if (!item || typeof item !== "object") continue;
  if (item.requiredForLaunch === true && item.included !== true) {
    blockers.push(`Scope item "${key}" is required for launch but not included.`);
  }
}

// --- Verdict ---
const ready = missing.length === 0 && blockers.length === 0;
const verdict = ready ? "READY" : "NOT READY";

console.log("");
console.log("=== AISTROYKA Pilot Intake Validation ===");
console.log(`File: ${fileArg}`);
console.log(`Verdict: ${verdict}`);
console.log("");

if (missing.length) {
  console.log("Missing launch-critical fields:");
  for (const m of missing) console.log(`  - ${m}`);
  console.log("");
}

if (blockers.length) {
  console.log("Blockers:");
  for (const b of blockers) console.log(`  - ${b}`);
  console.log("");
}

if (warnings.length) {
  console.log("Warnings:");
  for (const w of warnings) console.log(`  - ${w}`);
  console.log("");
}

if (ready) {
  console.log("Intake meets minimum launch-critical fields.");
  console.log("Resolve warnings and complete Day 0 checklist before client kickoff.");
} else {
  console.log("Fix missing fields and blockers before Day 0 launch.");
}

console.log("");
process.exit(ready ? 0 : 1);
