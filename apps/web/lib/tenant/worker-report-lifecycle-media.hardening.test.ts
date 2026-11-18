import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(__dirname, "../../supabase/migrations/20260906130500_harden_worker_report_lifecycle_and_media.sql"),
  "utf8"
).toLowerCase();
const repository = readFileSync(
  resolve(__dirname, "../domain/reports/report.repository.ts"),
  "utf8"
);
const route = readFileSync(
  resolve(__dirname, "../../app/api/v1/reports/[id]/route.ts"),
  "utf8"
);

describe("worker report lifecycle and media hardening", () => {
  it("binds report creation to the authenticated worker and a draft-only initial state", () => {
    expect(migration).toContain("create policy worker_reports_write_worker_insert");
    expect(migration).toContain("user_id = (select auth.uid())");
    expect(migration).toContain("status = 'draft'");
    expect(migration).toContain("submitted_at is null");
    expect(migration).toContain("reviewed_at is null");
    expect(migration).toContain("reviewed_by is null");
    expect(migration).toContain("worker_report_insert_links_valid(tenant_id, user_id, task_id, day_id)");
  });

  it("removes authenticated report deletion and uses a transition trigger for updates", () => {
    expect(migration).toContain("drop policy if exists worker_reports_write_internal_delete");
    expect(migration).not.toContain("create policy worker_reports_write_internal_delete");
    expect(migration).not.toMatch(/create policy\s+worker_reports[^\n]*delete/i);
    expect(migration).toContain("create trigger worker_reports_enforce_lifecycle");
    expect(migration).toContain("old.status in ('draft', 'changes_requested') and new.status = 'submitted'");
    expect(migration).toContain("old.status = 'submitted'");
    expect(migration).toContain("new.status in ('approved', 'rejected', 'changes_requested')");
  });

  it("prevents workers from forging review provenance and reviewers from editing worker content", () => {
    expect(migration).toContain("worker cannot mutate report review fields");
    expect(migration).toContain("reviewer cannot mutate worker report content");
    expect(migration).toContain("new.submitted_at := now()");
    expect(migration).toContain("new.reviewed_at := now()");
    expect(migration).toContain("new.reviewed_by := caller");
    expect(migration).toContain("manager note required for reject/changes requested");
  });

  it("matches the supported repository and review-route transitions", () => {
    expect(repository).toContain('status: "submitted"');
    expect(repository).toContain('.eq("status", "draft")');
    expect(repository).toContain('.eq("status", "changes_requested")');
    expect(repository).toContain('.eq("status", "submitted")');
    expect(route).toContain('const REVIEW_STATUSES: ReportReviewStatus[] = ["approved", "rejected", "changes_requested"]');
    expect(route).toContain("canReviewReportInRoute");
    expect(route).toContain('membership?.role === "manager"');
  });

  it("makes report evidence append-only and worker-owned while the report is editable", () => {
    expect(migration).toContain("create policy worker_report_media_insert_own_editable_report");
    expect(migration).toContain("wr.user_id = (select auth.uid())");
    expect(migration).toContain("wr.status in ('draft', 'changes_requested')");
    expect(migration).toContain("us.user_id = (select auth.uid())");
    expect(migration).toContain("us.status = 'finalized'");
    expect(migration).toContain("us.purpose in ('report_before', 'report_after')");
    expect(migration).toContain("drop policy if exists worker_report_media_write_internal_update");
    expect(migration).toContain("drop policy if exists worker_report_media_write_internal_delete");
    expect(migration).not.toMatch(/create policy\s+worker_report_media[^\n]*(update|delete)/i);
  });

  it("hides cross-tenant evidence links from the read policy", () => {
    expect(migration).toContain("m.tenant_id = wr.tenant_id");
    expect(migration).toContain("us.tenant_id = wr.tenant_id");
    expect(migration).toContain("wt.tenant_id = wr.tenant_id");
  });
});
