import { beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ adminAvailable: true, getBucket: vi.fn(), updateBucket: vi.fn().mockResolvedValue({ error: null }), bucket: vi.fn().mockResolvedValue({ error: null }), upload: vi.fn().mockResolvedValue({ error: null }), insert: vi.fn(), publicUrl: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: () => fake.adminAvailable ? ({ storage: { createBucket: fake.bucket, getBucket: fake.getBucket, updateBucket: fake.updateBucket } }) : null }));
vi.mock("@/lib/supabase/server", () => ({ getSessionUser: async () => ({ id: "caller" }), createClient: async () => ({ storage: { from: () => ({ upload: fake.upload, getPublicUrl: fake.publicUrl }) }, from: () => ({ insert: (row: unknown) => { fake.insert(row); return { select: () => ({ single: async () => ({ data: { id: "media", tenant_id: "tenant" }, error: null }) }) }; } }) }) }));
vi.mock("@/lib/supabase/rpc", () => ({ getProjectById: async () => ({ data: { tenant_id: "tenant" } }) }));
vi.mock("@/lib/auth/tenant", () => ({ hasMinRole: async () => true }));
vi.mock("@/lib/api/engine", () => ({ MEDIA_BUCKET: "media", createAnalysisJob: async () => ({ id: "job" }) }));
import { POST } from "./route";
beforeEach(() => { fake.adminAvailable = true; vi.clearAllMocks(); fake.getBucket.mockReset(); fake.getBucket.mockResolvedValue({ data: { public: false }, error: null }); });
import { POST as legacyPOST } from "@/app/api/projects/[id]/upload/route";
describe("private project upload", () => {
  it("keeps the legacy URL on the same canonical upload handler", () => { expect(legacyPOST).toBe(POST); });
  it("creates a private bucket and persists an object path for guarded previews", async () => {
    fake.getBucket.mockResolvedValueOnce({ data: null, error: { message: "Bucket not found" } });
    const project = "00000000-0000-4000-8000-000000000001";
    const form = new FormData(); form.append("file", new Blob(["synthetic"], { type: "image/png" }), "fixture.png");
    const response = await POST({ headers: new Headers(), formData: async () => form } as Request, { params: Promise.resolve({ id: project }) });
    expect(response.status).toBe(200); expect(fake.bucket).toHaveBeenCalledWith("media", { public: false });
    const stored = fake.insert.mock.calls[0][0]; expect(stored.file_url).toMatch(new RegExp(`^${project}/[0-9a-f-]+\\.png$`));
    expect(fake.publicUrl).not.toHaveBeenCalled(); expect(fake.upload).toHaveBeenCalledWith(stored.file_url, expect.any(Blob), { upsert: false });
  });
  it("enforces existing bucket privacy before upload", async () => {
    fake.getBucket.mockResolvedValueOnce({ data: { public: true }, error: null });
    const form = new FormData(); form.append("file", new Blob(["synthetic"]), "fixture.png");
    const r = await POST({ headers: new Headers(), formData: async () => form } as Request, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }) });
    expect(r.status).toBe(200); expect(fake.updateBucket).toHaveBeenCalledWith("media", { public: false });
  });
  it("denies upload when current bucket visibility cannot be verified", async () => {
    fake.getBucket.mockResolvedValue({ data: null, error: { message: "network unavailable" } });
    const form = new FormData(); form.append("file", new Blob(["synthetic"]), "fixture.png");
    const r = await POST({ headers: new Headers(), formData: async () => form } as Request, { params: Promise.resolve({ id: "project" }) });
    expect(r.status).toBe(503); expect(fake.upload).not.toHaveBeenCalled();
  });

  it("requires server private-bucket access without advertising a manual retry fix", async () => {
    fake.adminAvailable = false;
    const form = new FormData(); form.append("file", new Blob(["synthetic"]), "fixture.png");
    const r = await POST({ headers: new Headers(), formData: async () => form } as Request, { params: Promise.resolve({ id: "project" }) });
    expect(r.status).toBe(503); expect(fake.upload).not.toHaveBeenCalled();
    expect((await r.json()).error).toBe("File storage is unavailable. Contact the project administrator.");
  });

});
