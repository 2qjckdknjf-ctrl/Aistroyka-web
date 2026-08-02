/**
 * Static SQL contract for Phase 2C atomic multi rate limit + claim_token.
 * Does not apply the migration. Not a live Postgres concurrency proof.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATION = "supabase/migrations/20260725190000_rate_limit_try_increment.sql";

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("rate_limit_try_increment_multi migration contract", () => {
  it("defines multi RPC with sorted lock order and FOR UPDATE", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(/create or replace function public\.rate_limit_try_increment_multi\s*\(/i);
    expect(sql).toMatch(/order by elem\s*->>\s*'key'/i);
    expect(sql).toMatch(/for update/i);
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path\s*=\s*public/i);
    expect(sql).toMatch(/'allowed',\s*false/i);
    expect(sql).toMatch(/limited_dimension/i);
  });

  it("restricts multi execute to service_role", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(
      /grant execute on function public\.rate_limit_try_increment_multi[\s\S]*to service_role/i
    );
  });

  it("adds idempotency claim_token column", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(/add column if not exists claim_token text/i);
  });

  it("strict store calls multi rpc for help; public contact uses single-key module", () => {
    const src = readRelative("lib/platform/rate-limit/rate-limit.store.ts");
    expect(src).toMatch(/rate_limit_try_increment_multi/);
    expect(src).toMatch(/checkAndIncrementMultiStrict/);
    const service = readRelative("lib/platform/rate-limit/rate-limit.service.ts");
    expect(service).toMatch(/checkAndIncrementMultiStrict/);
    // HELP multi-path stays in service; anonymous contact single-key lives in a dedicated module.
    expect(service).not.toMatch(/checkAndIncrementStrict\(/);
    const contact = readRelative("lib/platform/rate-limit/public-contact-rate-limit.ts");
    expect(contact).toMatch(/checkAndIncrementStrict\(/);
    expect(contact).toMatch(/rate_limit_try_increment/);
  });
});

describe("live Postgres concurrency proof availability", () => {
  it("documents blocker: no local supabase config / docker for transaction test", () => {
    const hasConfig = existsSync(join(ROOT, "supabase/config.toml"));
    // apps/web has migrations but no config.toml; docker unavailable in this agent environment.
    expect(hasConfig).toBe(false);
    // This test intentionally asserts the environment gap so closure cannot claim live DB proof.
  });
});
