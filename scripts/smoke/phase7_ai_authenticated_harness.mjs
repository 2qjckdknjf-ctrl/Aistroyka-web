#!/usr/bin/env node
/**
 * Phase 7 authenticated AI harness (no-skip).
 * Exit 2 on missing prerequisites; exit 1 on failed assertions; exit 0 on pass.
 * Does not print secrets, tokens, or provider response bodies.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [
    resolve(root, ".env.pilot"),
    resolve(root, ".env.local"),
    resolve(root, "apps/web/.env.local"),
    resolve(root, "apps/web/.env.cf"),
  ]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    if (!m) continue;
    const v = m[1].trim().replace(/^['"]|['"]$/g, "");
    if (v) return v;
  }
  return "";
}

function status(name) {
  return readEnv(name) ? "PRESENT" : "MISSING";
}

const base = process.env.BASE_URL || "";
const image = process.env.IMAGE_URL || "";
const missing = [];
if (!base) missing.push("BASE_URL");
if (!image) missing.push("IMAGE_URL");
if (!readEnv("SMOKE_EMAIL") && !process.env.AUTH_HEADER) missing.push("AUTH_HEADER_or_SMOKE_EMAIL");
if (!readEnv("SMOKE_PASSWORD") && !process.env.AUTH_HEADER) missing.push("AUTH_HEADER_or_SMOKE_PASSWORD");
if (!readEnv("NEXT_PUBLIC_SUPABASE_URL") && !readEnv("SUPABASE_URL")) missing.push("SUPABASE_URL");
if (!readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") && !readEnv("SUPABASE_ANON_KEY")) {
  missing.push("SUPABASE_ANON_KEY");
}

console.log(
  JSON.stringify({
    harness: "phase7_ai_authenticated_harness",
    BASE_URL: base ? "PRESENT" : "MISSING",
    IMAGE_URL: image ? "PRESENT" : "MISSING",
    SMOKE_EMAIL: status("SMOKE_EMAIL"),
    OPENAI_API_KEY: status("OPENAI_API_KEY"),
    missing,
  })
);

if (missing.length) {
  console.error(`phase7 harness: missing prerequisites: ${missing.join(",")}`);
  process.exit(2);
}

const env = {
  ...process.env,
  BASE_URL: base,
  IMAGE_URL: image,
};
const r = spawnSync("bash", [resolve(root, "scripts/smoke/ai_live_provider.sh"), "--require-live"], {
  cwd: root,
  env,
  encoding: "utf8",
});
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 1);
