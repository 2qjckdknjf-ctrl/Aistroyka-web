import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260809110000_harden_client_requests_costs_estimate_writes.sql"
);

describe("client requests / costs / estimate RLS hardening migration", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines writer helper that excludes viewer roles", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(
      /create or replace function public\.is_internal_tenant_writer_for_tenant[\s\S]{0,800}?'viewer'/
    );
  });

  it("scopes client request writes to manage cohort + tenant match", () => {
    expect(sql).toMatch(
      /project_client_requests_write_internal_insert[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_client_requests_write_internal_delete[\s\S]{0,200}?can_manage_project_membership/
    );
    expect(sql).toMatch(
      /project_client_request_events_write_internal_insert[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).not.toMatch(
      /create policy project_client_requests_write_internal_delete on public\.project_client_requests[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });

  it("scopes stakeholder discussion writes to manage cohort", () => {
    expect(sql).toMatch(
      /stakeholder_discussions_write_internal_insert[\s\S]{0,300}?can_manage_project_membership[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).not.toMatch(
      /create policy stakeholder_discussions_write_internal_update on public\.project_stakeholder_discussions[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });

  it("blocks viewer writes on cost items and estimate results", () => {
    expect(sql).toMatch(
      /project_cost_items_internal_insert[\s\S]{0,300}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).toMatch(
      /project_cost_items_internal_delete[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /project_estimate_results_write_internal_insert[\s\S]{0,300}?is_internal_tenant_writer_for_tenant[\s\S]{0,200}?project_belongs_to_tenant/
    );
    expect(sql).not.toMatch(
      /create policy project_cost_items_internal_delete on public\.project_cost_items[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).not.toMatch(
      /create policy project_estimate_results_write_internal_delete on public\.project_estimate_results[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
  });
});
