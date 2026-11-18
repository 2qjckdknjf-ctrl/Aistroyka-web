import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(__dirname, "../../supabase/migrations");
const bootstrapName = "20260906113500_bootstrap_missing_aftercare_tables.sql";
const hardeningName = "20260906114000_harden_aftercare_assignments_sync_cursors.sql";
const finalName = "20260906125500_harden_aftercare_portal_tenant_scope.sql";

const bootstrap = readFileSync(resolve(migrationsDir, bootstrapName), "utf8").toLowerCase();
const hardening = readFileSync(resolve(migrationsDir, hardeningName), "utf8").toLowerCase();
const finalSql = readFileSync(resolve(migrationsDir, finalName), "utf8").toLowerCase();
const service = readFileSync(
  resolve(__dirname, "../domain/aftercare/aftercare.service.ts"),
  "utf8"
);

describe("aftercare bootstrap and portal scope hardening", () => {
  it("orders schema bootstrap before write hardening and final portal scope", () => {
    expect(bootstrapName < hardeningName).toBe(true);
    expect(hardeningName < finalName).toBe(true);
  });

  it("bootstraps missing aftercare schema idempotently and fail-closed", () => {
    expect(bootstrap).toContain("create table if not exists public.project_service_requests");
    expect(bootstrap).toContain("create table if not exists public.project_service_request_events");
    expect(bootstrap).toContain("create index if not exists idx_project_service_requests_project");
    expect(bootstrap).toContain("create index if not exists idx_project_service_request_events_req");
    expect(bootstrap).toContain("alter table public.project_service_requests enable row level security");
    expect(bootstrap).toContain("alter table public.project_service_request_events enable row level security");
    expect(bootstrap).toContain("if not exists (");

    // Bootstrap must never resurrect the historical broad internal reader-as-writer policy.
    expect(bootstrap).not.toContain("create policy project_service_requests_write_internal");
    // Portal creation is intentionally withheld until the final strict policy migration.
    expect(bootstrap).not.toContain("create policy project_service_requests_insert_portal");
  });

  it("keeps 114000 responsible for hardened internal writes and portal initial events", () => {
    expect(hardening).toContain("create policy project_service_requests_write_internal_insert");
    expect(hardening).toContain("public.can_manage_project_membership(tenant_id, project_id)");
    expect(hardening).toContain("public.project_belongs_to_tenant(project_id, tenant_id)");
    expect(hardening).toContain("create policy project_service_request_events_insert_portal_initial");
  });

  it("binds final portal inserts to the project tenant and supported stakeholder shape", () => {
    expect(finalSql).toContain("create policy project_service_requests_insert_portal");
    expect(finalSql).toContain("public.project_belongs_to_tenant(project_id, tenant_id)");
    expect(finalSql).toContain("public.is_portal_stakeholder_for_project(project_id)");
    expect(finalSql).toContain("created_by = (select auth.uid())");
    expect(finalSql).toContain("status = 'reported'");
    expect(finalSql).toContain("coverage_type = 'warranty_review_needed'");
    expect(finalSql).toContain("assigned_to is null");
    expect(finalSql).toContain("due_date is null");
    expect(finalSql).toContain("resolution_note is null");
    expect(finalSql).toContain("resolved_at is null");
    expect(finalSql).toContain("resolved_by is null");
    expect(finalSql).toContain("linked_handover_id is not null");
    expect(finalSql).toContain("h.tenant_id = project_service_requests.tenant_id");
    expect(finalSql).toContain("h.project_id = project_service_requests.project_id");
    expect(finalSql).toContain("h.status in ('handed_over', 'completed')");
    expect(finalSql).toContain("linked_defect_id is null");
    expect(finalSql).toContain("linked_discussion_id is null");
  });

  it("matches the production stakeholder service-controlled fields", () => {
    const start = service.indexOf("export async function createServiceRequestStakeholder");
    expect(start).toBeGreaterThanOrEqual(0);
    const stakeholderSection = service.slice(start, service.indexOf("export async function patchServiceRequestManager", start));
    expect(stakeholderSection).toContain("tenant_id: ctx.tenantId");
    expect(stakeholderSection).toContain("project_id: projectId");
    expect(stakeholderSection).toContain('status: "reported"');
    expect(stakeholderSection).toContain('coverage_type: "warranty_review_needed"');
    expect(stakeholderSection).toContain("assigned_to: null");
    expect(stakeholderSection).toContain("due_date: null");
    expect(stakeholderSection).toContain("linked_handover_id: gate.handoverId");
    expect(stakeholderSection).toContain("linked_defect_id: null");
    expect(stakeholderSection).toContain("linked_discussion_id: null");
    expect(stakeholderSection).toContain("created_by: ctx.userId");
  });

  it("requires tenant/project consistency on aftercare read paths", () => {
    expect(finalSql).toContain("create policy project_service_requests_select");
    expect(finalSql).toContain("create policy project_service_request_events_select");
    expect(finalSql).toContain("sr.tenant_id = project_service_request_events.tenant_id");
    expect(finalSql).toContain("sr.project_id = project_service_request_events.project_id");
  });
});
