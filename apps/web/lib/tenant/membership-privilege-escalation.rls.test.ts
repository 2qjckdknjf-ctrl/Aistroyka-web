import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "../../supabase/migrations/20260906090000_block_membership_privilege_escalation.sql"
  ),
  "utf8"
);

describe("membership privilege-escalation RLS", () => {
  it("binds tenant_members INSERT role to a matching invitation", () => {
    expect(migration).toContain("drop policy if exists tenant_members_insert_self_or_invited");
    expect(migration).toContain("create policy tenant_members_insert_self_or_invited");
    expect(migration).toContain("and ti.role = tenant_members.role");
    expect(migration).toContain("role = 'stakeholder'");
  });

  it("installs a BEFORE UPDATE trigger that blocks unauthorized role escalation", () => {
    expect(migration).toContain("create or replace function public.enforce_tenant_members_role_change");
    expect(migration).toContain("create trigger tenant_members_enforce_role_change");
    expect(migration).toContain("before update on public.tenant_members");
    expect(migration).toContain("tenant_members.role change not permitted for authenticated clients");
    expect(migration).toContain("old.role = 'viewer'");
    expect(migration).toContain("new.role = 'stakeholder'");
  });

  it("splits project_stakeholders broad access and blocks invitee INSERT", () => {
    expect(migration).toContain("drop policy if exists project_stakeholders_access");
    expect(migration).toContain("create policy project_stakeholders_select");
    expect(migration).toContain("create policy project_stakeholders_insert_internal");
    expect(migration).toContain("create policy project_stakeholders_update");
    expect(migration).toContain("create policy project_stakeholders_delete_internal");
    const insertPolicy = migration.match(
      /create policy project_stakeholders_insert_internal[\s\S]*?;/
    )?.[0];
    expect(insertPolicy).toBeTruthy();
    expect(insertPolicy).toContain("is_internal_tenant_reader_for_tenant");
    expect(insertPolicy).not.toContain("auth.jwt()");
  });

  it("revokes privileged project_stakeholders column updates from authenticated", () => {
    expect(migration).toContain(
      "revoke update on table public.project_stakeholders from authenticated"
    );
    expect(migration).toContain(
      "grant update (status, user_id, accepted_at, updated_at)"
    );
    expect(migration).not.toMatch(
      /grant update \([^)]*stakeholder_role[^)]*\)\s+on public\.project_stakeholders/
    );
    expect(migration).not.toMatch(
      /grant update \([^)]*project_id[^)]*\)\s+on public\.project_stakeholders/
    );
    expect(migration).not.toMatch(
      /grant update \([^)]*tenant_id[^)]*\)\s+on public\.project_stakeholders/
    );
  });
});
