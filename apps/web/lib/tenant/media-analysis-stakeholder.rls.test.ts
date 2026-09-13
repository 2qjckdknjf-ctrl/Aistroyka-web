import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "../../supabase/migrations/20260803112000_media_analysis_exclude_stakeholder.sql"
  ),
  "utf8"
);

describe("media/analysis stakeholder RLS", () => {
  it("drops the bare tenant_members FOR ALL media policy", () => {
    expect(migration).toContain('drop policy if exists "media_tenant" on public.media');
    expect(migration).toContain("is_internal_tenant_reader_for_tenant(tenant_id)");
  });

  it("keeps project-scoped media SELECT for portal stakeholders", () => {
    expect(migration).toContain("media_select_portal");
    expect(migration).toContain("is_portal_stakeholder_for_project(project_id)");
  });

  it("does not grant analysis_jobs or ai_analysis writes via bare tenant_members", () => {
    expect(migration).toContain('drop policy if exists "analysis_jobs_tenant"');
    expect(migration).toContain('drop policy if exists "ai_analysis_tenant"');
    expect(migration).not.toMatch(
      /create policy[\s\S]*tenant_id in \(select tenant_id from public\.tenant_members/
    );
  });
});
