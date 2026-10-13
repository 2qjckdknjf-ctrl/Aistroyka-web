import { describe, expect, it, vi } from "vitest";
import { resolveAIMediaImage } from "./resolve-ai-media-image";

vi.mock("@/lib/config", () => ({ getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co" }) }));

const tenant = "11111111-1111-4111-8111-111111111111";
const project = "22222222-2222-4222-8222-222222222222";
const otherProject = "33333333-3333-4333-8333-333333333333";
const report = "44444444-4444-4444-8444-444444444444";
const media = "55555555-5555-4555-8555-555555555555";
const upload = "66666666-6666-4666-8666-666666666666";
type Row = Record<string, unknown>;

function fixture(overrides: Record<string, Row[]> = {}, errorTable?: string) {
  const rows: Record<string, Row[]> = {
    worker_reports: [{ id: report, tenant_id: tenant, task_id: "task", day_id: null }],
    worker_tasks: [{ id: "task", tenant_id: tenant, project_id: project }],
    worker_day: [],
    projects: [{ id: project, tenant_id: tenant }, { id: otherProject, tenant_id: tenant }],
    worker_report_media: [{ id: "attachment", report_id: report, media_id: media, upload_session_id: upload }],
    media: [{ id: media, tenant_id: tenant, project_id: project, file_url: `${tenant}/photo.jpg` }],
    upload_sessions: [{ id: upload, tenant_id: tenant, status: "finalized", object_path: `${tenant}/${upload}/photo.jpg` }],
    ...overrides,
  };
  const sign = vi.fn(async () => ({ data: { signedUrl: "https://signed.example/photo" }, error: null }));
  const client = {
    from: vi.fn((table: string) => {
      const filters: Array<[string, unknown]> = [];
      const q = {
        select: vi.fn(() => q), limit: vi.fn(() => q),
        eq: vi.fn((key: string, value: unknown) => { filters.push([key, value]); return q; }),
        maybeSingle: vi.fn(async () => ({
          data: (rows[table] ?? []).find(row => filters.every(([key, value]) => row[key] === value)) ?? null,
          error: errorTable === table ? { message: "private database diagnostic" } : null,
        })),
      };
      return q;
    }),
    storage: { from: vi.fn(() => ({ createSignedUrl: sign })) },
  };
  return { client: client as any, sign };
}

async function denied(f: ReturnType<typeof fixture>, input: Record<string, unknown> = {}) {
  const result = await resolveAIMediaImage(f.client, { tenantId: tenant, reportId: report, mediaId: media, ...input });
  expect(result).toMatchObject({ ok: false, code: "AI_MEDIA_ACCESS_DENIED", retryable: false });
  expect(f.sign).not.toHaveBeenCalled();
}

describe("report source binding before private signing", () => {
  it("rejects media in the same project that is not attached to this report", async () => {
    await denied(fixture({ worker_report_media: [] }));
  });
  it("rejects a media/upload pair assembled from different attachments", async () => {
    await denied(fixture({ worker_report_media: [
      { id: "one", report_id: report, media_id: media, upload_session_id: null },
      { id: "two", report_id: report, media_id: null, upload_session_id: upload },
    ] }), { uploadSessionId: upload });
  });
  it("does not substitute a raw storage URL when the bound source is unavailable", async () => {
    const f = fixture({ media: [] });
    const result = await resolveAIMediaImage(f.client, {
      tenantId: tenant, reportId: report, mediaId: media, imageUrl: `${tenant}/unrelated.jpg`,
    });
    expect(result.ok).toBe(false);
    expect(f.sign).not.toHaveBeenCalled();
  });
  it("rejects unbound legacy URLs for report jobs", async () => {
    await denied(fixture(), { mediaId: null, imageUrl: `${tenant}/unrelated.jpg` });
  });
  it("rejects a media path belonging to another project of the same tenant", async () => {
    await denied(fixture({ media: [{ id: media, tenant_id: tenant, project_id: project, file_url: `${otherProject}/photo.jpg` }] }));
  });
  it("rejects a project claim without a report when its path belongs to another project", async () => {
    const f = fixture();
    const result = await resolveAIMediaImage(f.client, {
      tenantId: tenant, projectIdClaim: project, imageUrl: `${otherProject}/photo.jpg`,
    });
    expect(result).toMatchObject({ ok: false, code: "AI_MEDIA_ACCESS_DENIED" });
    expect(f.sign).not.toHaveBeenCalled();
  });
  it("rejects a deleted task rather than recovering scope from a payload claim", async () => {
    await denied(fixture({ worker_tasks: [] }), { projectIdClaim: project });
  });
  it("rejects conflicting task and day project bindings", async () => {
    await denied(fixture({
      worker_reports: [{ id: report, tenant_id: tenant, task_id: "task", day_id: "day" }],
      worker_day: [{ id: "day", tenant_id: tenant, project_id: otherProject }],
    }));
  });
  it("fails retryably before signing if attachment lookup is unavailable", async () => {
    const f = fixture({}, "worker_report_media");
    const result = await resolveAIMediaImage(f.client, { tenantId: tenant, reportId: report, mediaId: media });
    expect(result).toMatchObject({ ok: false, code: "AI_MEDIA_STORAGE_TEMPORARY", retryable: true });
    expect(JSON.stringify(result)).not.toContain("private database diagnostic");
    expect(f.sign).not.toHaveBeenCalled();
  });
  it("preserves media and finalized-upload paths for the same attachment", async () => {
    for (const overrides of [{}, { media: [{ id: media, tenant_id: tenant, project_id: project, file_url: null }] }]) {
      const f = fixture(overrides);
      const result = await resolveAIMediaImage(f.client, { tenantId: tenant, reportId: report, mediaId: media, uploadSessionId: upload });
      expect(result).toMatchObject({ ok: true, trustedProjectId: project });
      expect(f.sign).toHaveBeenCalledTimes(1);
    }
  });
  it("preserves older worker days without a project_id column", async () => {
    const f = fixture({
      worker_reports: [{ id: report, tenant_id: tenant, task_id: null, day_id: "day" }],
      worker_day: [{ id: "day", tenant_id: tenant }],
    });
    const result = await resolveAIMediaImage(f.client, { tenantId: tenant, reportId: report, uploadSessionId: upload });
    expect(result).toMatchObject({ ok: true, source: "upload_session", trustedProjectId: null });
  });
});
