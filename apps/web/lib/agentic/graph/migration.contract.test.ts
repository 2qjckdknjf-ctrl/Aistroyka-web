import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("agentic foundation migration contract", () => {
  const sql = readFileSync(
    resolve(__dirname, "../../../supabase/migrations/20260829120000_agentic_foundation.sql"),
    "utf8"
  );

  it("is additive and enables RLS on new tables", () => {
    expect(sql).toContain("create table if not exists public.construction_entities");
    expect(sql).toContain("create table if not exists public.construction_relations");
    expect(sql).toContain("create table if not exists public.agent_runs");
    expect(sql).toContain("create table if not exists public.agent_run_steps");
    expect(sql).toContain("create table if not exists public.proposed_agent_actions");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("is_internal_tenant_reader_for_tenant");
    expect(sql).toContain("can_read_project_membership");
    expect(sql).not.toMatch(/drop table/i);
    expect(sql).toContain("construction_entities_source_unique");
    expect(sql).toContain("AGENTIC_FOUNDATION_ENABLED");
  });
});
