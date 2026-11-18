import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { listReportPublication, setReportPublication } from "./report-publication.service";
const mock = vi.hoisted(() => ({ admin: vi.fn(), resolve: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: mock.admin }));
vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({ resolveAIMediaImage: mock.resolve }));
const id = "00000000-0000-4000-8000-000000000011", attachment = "00000000-0000-4000-8000-000000000012";
const ctx: TenantContext = { tenantId: "tenant", userId: "manager", role: "owner", clientProfile: "web", subscriptionTier: "free", traceId: "trace" };
let tables: Record<string, Record<string, unknown>[]>;
let errors: Record<string, string>;
let allowed: boolean, ready: boolean, writes: number, zero: boolean, race: (() => void) | undefined;
function client() {
  return {
    rpc: async (name: string) => ({ data: name === "published_evidence_source_guard_ready" ? ready : allowed, error: errors.rpc ? { code: errors.rpc } : null }),
    from(table: string) {
      const filters: [string, unknown][] = [];
      const sets: [string, unknown[]][] = [];
      let mutation: "insert" | "update" | undefined, value: Record<string, unknown>, count = Infinity;
      const result = () => {
        if (mutation) { writes++; race?.(); race = undefined; }
        const error = errors[table] ? { code: errors[table], message: "private database detail" } : null;
        let data = tables[table].filter(row => filters.every(([key, val]) => row[key] === val)
          && sets.every(([key, values]) => values.includes(row[key]))).slice(0, count);
        if (mutation && !error && !zero) {
          if (mutation === "insert") { data = [value]; tables[table].push(value); }
          else data.forEach(row => Object.assign(row, value));
        }
        if (mutation && zero) data = [];
        return { data, error };
      };
      const q = { select: () => q, order: () => q, limit: (n: number) => { count = n; return q; },
        eq: (k: string, v: unknown) => { filters.push([k, v]); return q; },
        in: (k: string, v: unknown[]) => { sets.push([k, v]); return q; },
        update: (v: Record<string, unknown>) => { mutation = "update"; value = v; return q; },
        insert: (v: Record<string, unknown>) => { mutation = "insert"; value = v; return q; },
        maybeSingle: async () => { const r = result(); return { ...r, data: r.data[0] ?? null }; },
        then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve) };
      return q;
    },
  } as unknown as SupabaseClient;
}
function evidence() { return { id: "legacy-evidence", tenant_id: "tenant", project_id: "project", report_id: id,
  task_id: "task", media_id: "media", upload_session_id: null, uploader_user_id: "worker", owner_visible: false,
  manager_verified: false, internal_only: false, retention_state: "active", source_kind: "photo", updated_at: "2026-10-12T00:00:00.000Z" }; }
const input = { attachmentId: attachment, visible: true, expectedVersion: null };
beforeEach(() => {
  vi.resetAllMocks(); errors = {}; allowed = true; ready = true; writes = 0; zero = false; race = undefined;
  tables = { worker_reports: [{ id, tenant_id: "tenant", user_id: "worker", status: "approved", task_id: "task", day_id: null }],
    worker_tasks: [{ id: "task", tenant_id: "tenant", project_id: "project" }], worker_day: [],
    projects: [{ id: "project", tenant_id: "tenant", client_portal_enabled: true }],
    tenants: [{ id: "tenant", account_id: "account" }], accounts: [{ id: "account", status: "active" }],
    worker_report_media: [{ id: attachment, report_id: id, media_id: "media", upload_session_id: null }],
    visual_evidence_records: [], media: [{ id: "media", tenant_id: "tenant", project_id: "project", type: "image" }], upload_sessions: [] };
  mock.admin.mockReturnValue(client()); mock.resolve.mockResolvedValue({ ok: true, trustedProjectId: "project", objectPath: "private" });
});
it("approval alone lists unpublished attachments without materializing or publishing records", async () => {
  const result = await listReportPublication(client(), ctx, id);
  expect(result.items[0]).toMatchObject({ attachment_id: attachment, published: false, evidence_id: null }); expect(writes).toBe(0);
});
it("explicit publication derives stable source identity and original worker author server-side", async () => {
  const result = await setReportPublication(client(), ctx, id, input);
  expect(result).toMatchObject({ evidence_id: attachment, published: true });
  expect(tables.visual_evidence_records[0]).toMatchObject({ id: attachment, report_id: id, uploader_user_id: "worker", project_id: "project" });
});
it("reuses retained evidence without overwriting its id or reviewed metadata", async () => {
  tables.visual_evidence_records = [{ ...evidence(), checksum: "retained-checksum", zone_label: "retained-zone" }];
  const r = await setReportPublication(client(), ctx, id, { ...input, expectedVersion: evidence().updated_at });
  expect(r.evidence_id).toBe("legacy-evidence"); expect(tables.visual_evidence_records).toHaveLength(1);
  expect(tables.visual_evidence_records[0]).toMatchObject({ checksum: "retained-checksum", zone_label: "retained-zone" });
});
for (const profile of ["ios_customer", "ios_worker", "android_worker", "ios_lite"] as const) {
  it("denies field/customer client publication " + profile, async () => {
    await expect(setReportPublication(client(), { ...ctx, clientProfile: profile }, id, input)).rejects.toMatchObject({ status: 403 }); expect(writes).toBe(0);
  });
}
it("denies a manager without current project membership", async () => {
  allowed = false; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 403 }); expect(writes).toBe(0);
});
it("denies suspended account before source publication", async () => {
  tables.accounts[0].status = "suspended"; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 403 }); expect(writes).toBe(0);
});
for (const table of ["worker_reports", "worker_tasks", "rpc", "projects", "accounts", "worker_report_media", "visual_evidence_records", "media"]) {
  it("preserves DB failure as retryable without a write: " + table, async () => {
    errors[table] = "08006"; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 503 }); expect(writes).toBe(0);
  });
}
it("rejects unapproved report and disabled portal", async () => {
  tables.worker_reports[0].status = "submitted"; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  tables.worker_reports[0].status = "approved"; tables.projects[0].client_portal_enabled = false;
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 }); expect(writes).toBe(0);
});
it("withdraws publication without a Storage signer or an approved report", async () => {
  tables.visual_evidence_records = [{ ...evidence(), owner_visible: true, manager_verified: true }]; tables.worker_reports[0].status = "changes_requested";
  expect(await setReportPublication(client(), ctx, id, { ...input, visible: false, expectedVersion: evidence().updated_at })).toMatchObject({ published: false });
  expect(mock.resolve).not.toHaveBeenCalled();
});
it("refuses source identity conflicts, duplicates and stale versions", async () => {
  tables.visual_evidence_records = [{ ...evidence(), uploader_user_id: "different-worker" }];
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  tables.visual_evidence_records = [evidence(), { ...evidence(), id: "another" }];
  await expect(listReportPublication(client(), ctx, id)).rejects.toMatchObject({ status: 409 });
  tables.visual_evidence_records = [evidence()];
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 }); expect(writes).toBe(0);
});
it("returns a conflict rather than false success after lost CAS", async () => {
  tables.visual_evidence_records = [evidence()]; race = () => { tables.visual_evidence_records[0].updated_at = "2026-10-12T00:00:01.000Z"; };
  await expect(setReportPublication(client(), ctx, id, { ...input, expectedVersion: evidence().updated_at })).rejects.toMatchObject({ status: 409 });
  expect(tables.visual_evidence_records[0].owner_visible).toBe(false);
});
it("does not claim a zero-row insert succeeded", async () => {
  zero = true; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
});
it("rejects another project's resolver, video and transient resolution failures", async () => {
  mock.resolve.mockResolvedValue({ ok: true, trustedProjectId: "foreign" });
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  mock.resolve.mockResolvedValue({ ok: false, retryable: true });
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 503 });
  tables.media[0].type = "video"; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 }); expect(writes).toBe(0);
});
it("rejects conflicting task/day projects and foreign attachments", async () => {
  tables.worker_reports[0].day_id = "day"; tables.worker_day = [{ id: "day", tenant_id: "tenant", project_id: "different" }];
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  tables.worker_reports[0].day_id = null;
  await expect(setReportPublication(client(), ctx, id, { ...input, attachmentId: "foreign" })).rejects.toMatchObject({ status: 404 }); expect(writes).toBe(0);
});
it("does not duplicate a retained source bound to another report", async () => {
  tables.visual_evidence_records = [{ ...evidence(), report_id: "retained-old-report" }];
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  expect(writes).toBe(0); expect(tables.visual_evidence_records).toHaveLength(1);
});
it("a lost create response can be refreshed and retried without another record", async () => {
  await setReportPublication(client(), ctx, id, input);
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 });
  const refreshed = await listReportPublication(client(), ctx, id);
  await setReportPublication(client(), ctx, id, { ...input, expectedVersion: refreshed.items[0].version });
  expect(tables.visual_evidence_records).toHaveLength(1);
});
it("does not offer video or unfinished uploads as publishable photos", async () => {
  tables.media[0].type = "video";
  expect((await listReportPublication(client(), ctx, id)).items[0].eligible).toBe(false);
  tables.media[0].type = "image"; tables.worker_report_media[0].upload_session_id = "upload";
  tables.upload_sessions = [{ id: "upload", tenant_id: "tenant", status: "created", mime_type: "image/jpeg" }];
  expect((await listReportPublication(client(), ctx, id)).items[0].eligible).toBe(false);
  await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 409 }); expect(writes).toBe(0);
});
it("a unique creation conflict is recoverable and cannot be reported as published", async () => {
  const current = client();
  race = () => { errors.visual_evidence_records = "23505"; };
  await expect(setReportPublication(current, ctx, id, input)).rejects.toMatchObject({ status: 409 });
  expect(tables.visual_evidence_records).toHaveLength(0);
});
it("fails closed before uniqueness is installed, while withdrawal remains available", async () => {
  ready = false; await expect(setReportPublication(client(), ctx, id, input)).rejects.toMatchObject({ status: 503 }); expect(writes).toBe(0);
  tables.visual_evidence_records = [{ ...evidence(), owner_visible: true, manager_verified: true }];
  expect(await setReportPublication(client(), ctx, id, { ...input, visible: false, expectedVersion: evidence().updated_at })).toMatchObject({ published: false });
});
it("distinguishes retained publication intent from sharing disabled by portal or report state", async () => {
  tables.visual_evidence_records = [{ ...evidence(), owner_visible: true, manager_verified: true }];
  tables.projects[0].client_portal_enabled = false;
  expect((await listReportPublication(client(), ctx, id)).items[0]).toMatchObject({ published: true, sharing_enabled: false });
  tables.projects[0].client_portal_enabled = true; tables.worker_reports[0].status = "changes_requested";
  expect((await listReportPublication(client(), ctx, id)).items[0]).toMatchObject({ published: true, sharing_enabled: false });
});
