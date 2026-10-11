import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { listPublishedEvidence, downloadPublishedEvidence } from "./published-evidence.service";

const mock = vi.hoisted(() => ({ allowed: vi.fn(), admin: vi.fn(), resolve: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: mock.admin }));
vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({ resolveAIMediaImage: mock.resolve }));
const projectId = "00000000-0000-4000-8000-000000000301";
const evidenceId = "00000000-0000-4000-8000-000000000801";
const ctx: TenantContext = { tenantId: "t1", userId: "u1", role: "stakeholder", clientProfile: "ios_customer", subscriptionTier: "free", traceId: "trace" };
let client: SupabaseClient;
let tables: Record<string, Array<Record<string, unknown>>>;
let failedTable: string | undefined;
function adminClient(isRequester = false) {
  return {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const sets: Array<[string, unknown[]]> = [];
      let count = Infinity;
      const result = () => ({ data: (tables[table] ?? []).filter(row => filters.every(([key, value]) => row[key] === value) && sets.every(([key, values]) => values.includes(row[key]))).slice(0, count), error: table === failedTable ? { message: "private database detail" } : null });
      const chain = {
        select: () => chain,
        returns: () => chain,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return chain; },
        in: (key: string, values: unknown[]) => { sets.push([key, values]); return chain; },
        order: () => chain,
        limit: (n: number) => { count = n; return chain; },
        maybeSingle: async () => { const r = result(); return { ...r, data: isRequester && table === "projects" && !(await mock.allowed()) ? null : r.data[0] ?? null }; },
        then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve),
      };
      return chain;
    },
    storage: { from: () => ({ download: mock.download }) },
  } as unknown as SupabaseClient;
}
beforeEach(() => {
  vi.resetAllMocks(); failedTable = undefined;
  tables = {
    visual_evidence_records: [{ id: evidenceId, tenant_id: "t1", project_id: projectId, report_id: "r1", task_id: "task1", media_id: "m1", upload_session_id: null, uploader_user_id: "worker", zone_label: "Kitchen", before_after_kind: "after", capture_timestamp: null, source_kind: "photo", updated_at: "2026-10-11T12:00:00Z", owner_visible: true, manager_verified: true, internal_only: false, retention_state: "active", provenance: { actual_amount: 99 }, device_source: "secret-device", file_url: "secret-url" }],
    worker_reports: [{ id: "r1", tenant_id: "t1", user_id: "worker", status: "approved", task_id: "task1", day_id: null }],
    worker_report_media: [{ id: "link", report_id: "r1", media_id: "m1", upload_session_id: null }],
    worker_tasks: [{ id: "task1", tenant_id: "t1", project_id: projectId }],
    media: [{ id: "m1", tenant_id: "t1", project_id: projectId }],
    projects: [{ id: projectId, tenant_id: "t1", client_portal_enabled: true }],
    project_members: [],
    project_stakeholders: [{ id: "grant", tenant_id: "t1", project_id: projectId, user_id: "u1", status: "active", expires_at: null }],
    tenants: [{ id: "t1", account_id: "a1" }],
    accounts: [{ id: "a1", status: "active" }],
  };
  client = adminClient(true);
  mock.admin.mockReturnValue(adminClient()); mock.allowed.mockResolvedValue(true);
  mock.resolve.mockResolvedValue({ ok: true, trustedProjectId: projectId, objectPath: "t1/private-image.jpg", imageUrl: "https://storage.private/signed?token=secret" });
  mock.download.mockResolvedValue({ data: new Blob(["fixture-image"], { type: "image/jpeg" }), error: null });
});
describe("published evidence projection", () => {
  it("returns explicit public fields and an authenticated gateway, with no private source/finance fields", async () => {
    const result = await listPublishedEvidence(client, ctx, projectId);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].original_url).toBe(`/api/v1/portal/projects/${projectId}/evidence/${evidenceId}/original`);
    expect(JSON.stringify(result)).not.toMatch(/secret|actual_amount|uploader|provenance|device_source|file_url|media_id|report_id|signed/);
    expect(mock.resolve).not.toHaveBeenCalled();
  });
  it("denies revoked project access before privileged evidence lookup", async () => {
    mock.allowed.mockResolvedValue(false);
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 404 });
    expect(mock.admin).not.toHaveBeenCalled();
  });
  it("does not turn a DB outage into successful empty evidence", async () => {
    failedTable = "visual_evidence_records";
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 503 });
  });
  for (const table of ["projects", "project_members", "project_stakeholders", "tenants", "accounts"]) {
    it("preserves authorization lookup failure as retryable: " + table, async () => {
      failedTable = table;
      await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 503 });
    });
  }
  it("current project owner does not depend on an unrelated stakeholder lookup", async () => {
    tables.project_members = [{ tenant_id: "t1", project_id: projectId, user_id: "u1", role: "owner", status: "active" }];
    failedTable = "project_stakeholders";
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toHaveLength(1);
  });
  it("suspended account denies a still-active project grant", async () => {
    tables.accounts[0].status = "suspended";
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 404 });
  });
  it("expired grant denies published metadata", async () => {
    tables.project_stakeholders[0].expires_at = "2020-01-01T00:00:00Z";
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 404 });
  });
  for (const patch of [{ owner_visible: false }, { manager_verified: false }, { internal_only: true }, { retention_state: "archived" }, { project_id: "other" }, { tenant_id: "other" }]) {
    it("excludes unpublished/foreign records " + JSON.stringify(patch), async () => {
      Object.assign(tables.visual_evidence_records[0], patch);
      expect((await listPublishedEvidence(client, ctx, projectId)).items).toEqual([]);
    });
  }
  it("excludes evidence after approval is withdrawn", async () => {
    tables.worker_reports[0].status = "changes_requested";
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toEqual([]);
  });
  it("excludes detached report media", async () => {
    tables.worker_report_media = [];
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toEqual([]);
  });
  it("excludes changed report project lineage", async () => {
    tables.worker_tasks[0].project_id = "other";
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toEqual([]);
  });
  it("checks grant again before returning metadata", async () => {
    mock.allowed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 404 });
  });
  it("accepts a legacy day-linked report with current same-project proof", async () => {
    Object.assign(tables.worker_reports[0], { task_id: null, day_id: "d1" });
    tables.visual_evidence_records[0].task_id = null;
    tables.worker_day = [{ id: "d1", tenant_id: "t1", project_id: projectId }];
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toHaveLength(1);
  });
  it("propagates a day scope database outage instead of successful empty evidence", async () => {
    Object.assign(tables.worker_reports[0], { task_id: null, day_id: "d1" });
    tables.visual_evidence_records[0].task_id = null; failedTable = "worker_day";
    await expect(listPublishedEvidence(client, ctx, projectId)).rejects.toMatchObject({ status: 503 });
  });
  it("does not invent a project for an unscoped legacy day", async () => {
    Object.assign(tables.worker_reports[0], { task_id: null, day_id: "d1" });
    tables.visual_evidence_records[0].task_id = null;
    tables.worker_day = [{ id: "d1", tenant_id: "t1" }];
    expect((await listPublishedEvidence(client, ctx, projectId)).items).toEqual([]);
  });
});
describe("current-access original delivery", () => {
  it("downloads authorized private bytes without redirecting to or returning Storage URL", async () => {
    const blob = await downloadPublishedEvidence(client, ctx, projectId, evidenceId);
    expect(await blob.text()).toBe("fixture-image");
    expect(mock.download).toHaveBeenCalledWith("t1/private-image.jpg");
  });
  it("denies grant revocation during Storage download", async () => {
    mock.allowed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 404 });
  });
  it("denies publication withdrawal during Storage download", async () => {
    mock.download.mockImplementation(async () => { tables.visual_evidence_records[0].owner_visible = false; return { data: new Blob(["fixture"], { type: "image/jpeg" }), error: null }; });
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 404 });
  });
  it("denies unresolved/foreign original scope", async () => {
    mock.resolve.mockResolvedValue({ ok: true, trustedProjectId: "other", objectPath: "other/image" });
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 404 });
    expect(mock.download).not.toHaveBeenCalled();
  });
  it("never serves active SVG content inline", async () => {
    mock.download.mockResolvedValue({ data: new Blob(["<svg/>"], { type: "image/svg+xml" }), error: null });
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 415 });
  });
  it("keeps resolver dependency failures retryable", async () => {
    mock.resolve.mockResolvedValue({ ok: false, retryable: true });
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 503 });
    expect(mock.download).not.toHaveBeenCalled();
  });
  it("keeps corrupt or missing originals unavailable", async () => {
    mock.resolve.mockResolvedValue({ ok: false, retryable: false });
    await expect(downloadPublishedEvidence(client, ctx, projectId, evidenceId)).rejects.toMatchObject({ status: 404 });
  });
});
