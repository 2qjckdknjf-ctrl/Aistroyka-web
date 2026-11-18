import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906123000_harden_trigger_security_definer_execute_grants.sql"
);

describe("trigger SECURITY DEFINER execute-grant hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8").toLowerCase();

  it("removes public, anon and authenticated direct execution from trigger-only functions", () => {
    expect(sql).toMatch(
      /revoke all privileges on function public\.jobs_protect_payload_project_tenant\(\)[\s\S]{0,100}?from public, anon, authenticated/
    );
    expect(sql).toMatch(
      /revoke all privileges on function public\.media_protect_file_url\(\)[\s\S]{0,100}?from public, anon, authenticated/
    );
  });

  it("keeps service-role execution available for trusted server/administrative use", () => {
    expect(sql).toMatch(
      /grant execute on function public\.jobs_protect_payload_project_tenant\(\)[\s\S]{0,80}?to service_role/
    );
    expect(sql).toMatch(
      /grant execute on function public\.media_protect_file_url\(\)[\s\S]{0,80}?to service_role/
    );
  });

  it("does not revoke authenticated execution from project-membership helpers used by RLS", () => {
    expect(sql).not.toMatch(
      /revoke[^;]*function\s+public\.can_manage_project_membership[^;]*authenticated/
    );
    expect(sql).not.toMatch(
      /revoke[^;]*function\s+public\.can_read_project_membership[^;]*authenticated/
    );
  });
});
