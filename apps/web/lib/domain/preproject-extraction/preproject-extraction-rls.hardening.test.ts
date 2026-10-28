import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const createSql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261028170000_preproject_extraction_observations.sql"),
  "utf8"
);
const hardenSql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261028171000_harden_preproject_extraction_identity.sql"),
  "utf8"
);

describe("preproject extraction RLS identity hardening", () => {
  it("keeps authenticated review UPDATE but does not grant DELETE", () => {
    expect(createSql).toMatch(
      /grant select, insert, update on table public\.preproject_extraction_runs to authenticated/
    );
    expect(createSql).toMatch(
      /grant select, insert, update on table public\.preproject_observations to authenticated/
    );
    expect(createSql).not.toMatch(/grant .*delete.*preproject_extraction_runs/i);
    expect(createSql).not.toMatch(/grant .*delete.*preproject_observations/i);
  });

  it("binds run writes to tenant-owned project and intake draft", () => {
    expect(hardenSql).toMatch(
      /preproject_extraction_runs_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*project_id is null[\s\S]*project_belongs_to_tenant\(project_id, tenant_id\)[\s\S]*intake_draft_id is null[\s\S]*intake_draft_belongs_to_tenant\(intake_draft_id, tenant_id\)/
    );
    expect(hardenSql).toMatch(
      /preproject_extraction_runs_update[\s\S]*with check \([\s\S]*project_belongs_to_tenant\(project_id, tenant_id\)[\s\S]*intake_draft_belongs_to_tenant\(intake_draft_id, tenant_id\)/
    );
  });

  it("binds observation writes to a run in the same tenant", () => {
    expect(hardenSql).toMatch(
      /preproject_observations_insert[\s\S]*is_internal_tenant_writer_for_tenant[\s\S]*preproject_extraction_run_belongs_to_tenant\(run_id, tenant_id\)/
    );
    expect(hardenSql).toMatch(
      /preproject_observations_update[\s\S]*preproject_extraction_run_belongs_to_tenant\(run_id, tenant_id\)/
    );
  });

  it("locks tenant/project/run identity and observation payload on client updates", () => {
    expect(hardenSql).toContain("enforce_preproject_extraction_run_identity_immutable");
    expect(hardenSql).toContain("enforce_preproject_observation_identity_immutable");
    expect(hardenSql).toContain("new.tenant_id is distinct from old.tenant_id");
    expect(hardenSql).toContain("new.project_id is distinct from old.project_id");
    expect(hardenSql).toContain("new.intake_draft_id is distinct from old.intake_draft_id");
    expect(hardenSql).toContain("new.run_id is distinct from old.run_id");
    expect(hardenSql).toContain("new.payload is distinct from old.payload");
    expect(hardenSql).toContain("before update on public.preproject_extraction_runs");
    expect(hardenSql).toContain("before update on public.preproject_observations");
    expect(hardenSql).toMatch(/preproject_extraction_runs identity fields are immutable/);
    expect(hardenSql).toMatch(/preproject_observations identity fields are immutable/);
    expect(hardenSql).toMatch(
      /revoke all on function public\.enforce_preproject_extraction_run_identity_immutable\(\) from public, anon, authenticated/
    );
    expect(hardenSql).toMatch(
      /revoke all on function public\.enforce_preproject_observation_identity_immutable\(\) from public, anon, authenticated/
    );
  });
});
