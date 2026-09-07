import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(__dirname, "../../supabase/migrations");
const wave2Path = "20260906092000_harden_viewer_project_jobs_estimate_writes.sql";
const genericWave1Path = "20260906104000_project_write_authorization_hardening.sql";
const finalPath = "20260906125000_reassert_project_write_scope_after_wave_ordering.sql";

const wave2 = readFileSync(resolve(migrationsDir, wave2Path), "utf8").toLowerCase();
const genericWave1 = readFileSync(resolve(migrationsDir, genericWave1Path), "utf8").toLowerCase();
const finalSql = readFileSync(resolve(migrationsDir, finalPath), "utf8").toLowerCase();

function policyBlock(sql: string, policyName: string): string {
  const marker = `create policy ${policyName.toLowerCase()}`;
  const start = sql.indexOf(marker);
  expect(start, `missing ${policyName}`).toBeGreaterThanOrEqual(0);
  const tail = sql.slice(start);
  const end = tail.indexOf(";");
  expect(end, `unterminated ${policyName}`).toBeGreaterThanOrEqual(0);
  return tail.slice(0, end + 1);
}

describe("final project-write migration ordering", () => {
  it("places the final-state guard after both overlapping policy migrations", () => {
    expect(wave2Path < genericWave1Path).toBe(true);
    expect(genericWave1Path < finalPath).toBe(true);
  });

  it("documents the ordering conflict this guard repairs", () => {
    expect(policyBlock(wave2, "projects_write_internal_delete")).toContain(
      "public.is_tenant_owner_or_admin(tenant_id)"
    );
    expect(policyBlock(genericWave1, "projects_write_internal_delete")).toContain(
      "public.is_internal_tenant_writer_for_tenant(tenant_id)"
    );

    for (const policy of [
      "project_documents_write_internal_insert",
      "project_documents_write_internal_update",
      "project_milestones_write_internal_insert",
      "project_milestones_write_internal_update",
    ]) {
      expect(policyBlock(wave2, policy)).toContain("public.project_belongs_to_tenant(project_id, tenant_id)");
      expect(policyBlock(genericWave1, policy)).not.toContain("public.project_belongs_to_tenant(project_id, tenant_id)");
    }
  });

  it("reasserts owner/admin-only project deletion as the final policy", () => {
    const block = policyBlock(finalSql, "projects_write_internal_delete");
    expect(block).toContain("for delete");
    expect(block).toContain("to authenticated");
    expect(block).toContain("public.is_tenant_owner_or_admin(tenant_id)");
    expect(block).not.toContain("public.is_internal_tenant_writer_for_tenant(tenant_id)");
  });

  it("reasserts tenant/project consistency for document and milestone writes", () => {
    for (const policy of [
      "project_documents_write_internal_insert",
      "project_documents_write_internal_update",
      "project_milestones_write_internal_insert",
      "project_milestones_write_internal_update",
    ]) {
      const block = policyBlock(finalSql, policy);
      expect(block).toContain("public.is_internal_tenant_writer_for_tenant(tenant_id)");
      expect(block).toContain("public.project_belongs_to_tenant(project_id, tenant_id)");
    }
  });

  it("keeps document and milestone delete in the internal writer cohort", () => {
    for (const policy of [
      "project_documents_write_internal_delete",
      "project_milestones_write_internal_delete",
    ]) {
      const block = policyBlock(finalSql, policy);
      expect(block).toContain("public.is_internal_tenant_writer_for_tenant(tenant_id)");
    }
  });
});
