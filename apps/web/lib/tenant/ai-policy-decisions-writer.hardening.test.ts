import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906124000_harden_ai_policy_decision_writes.sql"
);

const sql = readFileSync(MIGRATION, "utf8").toLowerCase();

describe("AI policy decision writer hardening", () => {
  it("removes the historical authenticated/internal INSERT policy", () => {
    expect(sql).toContain("drop policy if exists ai_policy_decisions_insert on public.ai_policy_decisions");
    expect(sql).not.toMatch(/create\s+policy\s+ai_policy_decisions_[^;]*for\s+insert/i);
  });

  it("does not weaken RLS or create a public/authenticated insert grant", () => {
    expect(sql).not.toMatch(/disable\s+row\s+level\s+security/);
    expect(sql).not.toMatch(/grant\s+insert[^;]*to\s+(public|anon|authenticated)/);
  });

  it("documents service-role as the trusted runtime writer", () => {
    expect(sql).toContain("service_role bypasses rls");
    expect(sql).toContain("runpolicy()");
  });
});
