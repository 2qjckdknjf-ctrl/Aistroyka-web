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

  it("binds idempotency to tenant + project + actor", () => {
    expect(sql).toContain("unique (tenant_id, project_id, actor_user_id, idempotency_key)");
  });

  it("is SELECT-only for authenticated; writes are service_role", () => {
    expect(sql).toMatch(/grant select on public\.agent_runs to authenticated/);
    expect(sql).toMatch(/grant select on public\.agent_run_steps to authenticated/);
    expect(sql).toMatch(/grant select on public\.proposed_agent_actions to authenticated/);
    expect(sql).not.toMatch(/grant insert on public\.agent_runs to authenticated/i);
    expect(sql).not.toMatch(/grant update on public\.agent_runs to authenticated/i);
    expect(sql).not.toMatch(/grant delete on public\.agent_runs to authenticated/i);
    expect(sql).not.toMatch(/grant insert on public\.proposed_agent_actions to authenticated/i);
    expect(sql).not.toMatch(/grant update on public\.proposed_agent_actions to authenticated/i);
    expect(sql).toMatch(/grant all on public\.agent_runs to service_role/);
    expect(sql).toMatch(/grant all on public\.proposed_agent_actions to service_role/);
    const created = sql.match(/create policy [\s\S]+?;/gi) ?? [];
    expect(created.length).toBeGreaterThan(0);
    for (const policy of created) {
      expect(policy.toLowerCase()).not.toContain(" for insert");
      expect(policy.toLowerCase()).not.toContain(" for update");
      expect(policy.toLowerCase()).not.toContain(" for delete");
    }
  });
});
