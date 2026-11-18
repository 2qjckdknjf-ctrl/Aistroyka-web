import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../supabase/migrations/20260906130510_preserve_worker_report_media_portal_reads.sql"),
  "utf8"
).toLowerCase();

describe("worker report media portal read hardening", () => {
  it("uses a boolean security-definer helper for cross-table tenant consistency", () => {
    expect(sql).toContain("create or replace function public.worker_report_media_link_same_tenant");
    expect(sql).toContain("security definer");
    expect(sql).toContain("m.tenant_id = wr.tenant_id");
    expect(sql).toContain("us.tenant_id = wr.tenant_id");
    expect(sql).toContain("grant execute on function public.worker_report_media_link_same_tenant");
  });

  it("preserves portal project access while requiring a tenant-safe evidence link", () => {
    expect(sql).toContain("drop policy if exists worker_report_media_select_portal");
    expect(sql).toContain("create policy worker_report_media_select_portal");
    expect(sql).toContain("worker_report_media_link_same_tenant(report_id, media_id, upload_session_id)");
    expect(sql).toContain("public.is_portal_stakeholder_for_project(wt.project_id)");
    expect(sql).toContain("wt.tenant_id = wr.tenant_id");
  });

  it("does not grant direct table access to media or upload sessions", () => {
    expect(sql).not.toMatch(/grant\s+(select|all).*upload_sessions/);
    expect(sql).not.toMatch(/grant\s+(select|all).*public\.media/);
  });
});
