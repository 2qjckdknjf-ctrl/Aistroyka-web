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

  it("scopes project_stakeholder creation/deletion to project managers", () => {
    expect(migration).toContain("drop policy if exists project_stakeholders_access");
    expect(migration).toContain("create policy project_stakeholders_select");
    expect(migration).toContain("create policy project_stakeholders_insert_internal");
    expect(migration).toContain("create policy project_stakeholders_update");
    expect(migration).toContain("create policy project_stakeholders_delete_internal");

    const insertPolicy = migration.match(
      /create policy project_stakeholders_insert_internal[\s\S]*?;/
    )?.[0];
    expect(insertPolicy).toBeTruthy();
    expect(insertPolicy).toContain("can_manage_project_membership");
    expect(insertPolicy).not.toContain("is_internal_tenant_reader_for_tenant");
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

const transitionMigration = readFileSync(
  join(
    __dirname,
    "../../supabase/migrations/20260923110000_block_stakeholder_self_reactivation.sql"
  ),
  "utf8"
);

describe("project_stakeholders status transition trigger", () => {
  it("installs a BEFORE UPDATE trigger that blocks self-reactivation", () => {
    expect(transitionMigration).toContain(
      "create or replace function public.enforce_project_stakeholders_transition()"
    );
    expect(transitionMigration).toContain(
      "create trigger project_stakeholders_enforce_transition"
    );
    expect(transitionMigration).toContain("before update on public.project_stakeholders");
    expect(transitionMigration).toContain(
      "project_stakeholders update not permitted for authenticated clients"
    );
    expect(transitionMigration).toContain("coalesce(auth.role(), '') = 'service_role'");
    expect(transitionMigration).toContain("tm.role in ('owner', 'admin')");
    expect(transitionMigration).toContain("pm.role in ('manager', 'owner')");
    expect(transitionMigration).toContain("pm.status = 'active'");
  });

  it("allows only an unexpired invited→active accept bound to the caller", () => {
    expect(transitionMigration).toContain("old.status = 'invited'");
    expect(transitionMigration).toContain("new.status = 'active'");
    expect(transitionMigration).toContain("old.expires_at > now()");
    expect(transitionMigration).toContain("new.user_id = caller");
    expect(transitionMigration).toContain("old.user_id is null or old.user_id = caller");
    expect(transitionMigration).toContain("lower(trim(coalesce(old.email, ''))) = caller_email");
  });

  it("keeps identity columns immutable for non-manager callers", () => {
    expect(transitionMigration).toContain("new.tenant_id is distinct from old.tenant_id");
    expect(transitionMigration).toContain("new.project_id is distinct from old.project_id");
    expect(transitionMigration).toContain("new.email is distinct from old.email");
    expect(transitionMigration).toContain(
      "new.stakeholder_role is distinct from old.stakeholder_role"
    );
    expect(transitionMigration).toContain("new.token is distinct from old.token");
    expect(transitionMigration).toContain("new.expires_at is distinct from old.expires_at");
    expect(transitionMigration).toContain(
      "project_stakeholders identity columns are immutable for authenticated clients"
    );
  });

  it("is not directly executable by authenticated or anon clients", () => {
    expect(transitionMigration).toContain(
      "revoke all on function public.enforce_project_stakeholders_transition() from public, anon, authenticated"
    );
    expect(transitionMigration).toContain(
      "grant execute on function public.enforce_project_stakeholders_transition() to service_role"
    );
  });
});
