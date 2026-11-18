import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906113000_harden_client_requests_costs_estimate_writes.sql"
);

describe("client requests / costs / estimate RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("scopes client request writes to project manage cohort + tenant match", () => {
    expect(sql).toMatch(
      /project_client_requests_write_internal_insert[\s\S]{0,350}?can_manage_project_membership[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_client_requests_write_internal_delete[\s\S]{0,250}?can_manage_project_membership/
    );
    expect(sql).toMatch(
      /project_client_request_events_write_internal_insert[\s\S]{0,350}?can_manage_project_membership[\s\S]{0,250}?project_belongs_to_tenant/
    );
  });

  it("scopes stakeholder discussion row writes to project managers/owners", () => {
    expect(sql).toMatch(
      /stakeholder_discussions_write_internal_insert[\s\S]{0,350}?can_manage_project_membership[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /stakeholder_discussions_write_internal_update[\s\S]{0,300}?can_manage_project_membership/
    );
  });

  it("excludes viewers and requires tenant match for cost items", () => {
    expect(sql).toMatch(
      /project_cost_items_internal_insert[\s\S]{0,350}?is_internal_tenant_writer_for_tenant[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_cost_items_internal_delete[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("excludes viewers and requires tenant match for estimate results", () => {
    expect(sql).toMatch(
      /project_estimate_results_write_internal_insert[\s\S]{0,350}?is_internal_tenant_writer_for_tenant[\s\S]{0,250}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_estimate_results_write_internal_delete[\s\S]{0,250}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("does not use the reader helper in any Wave 3 write policy", () => {
    expect(sql).not.toContain("is_internal_tenant_reader_for_tenant");
  });
});
