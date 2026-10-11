import { describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ bucket: vi.fn().mockResolvedValue({ error: null }), upload: vi.fn().mockResolvedValue({ error: null }), insert: vi.fn(), publicUrl: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: () => ({ storage: { createBucket: fake.bucket } }) }));
vi.mock("@/lib/supabase/server", () => ({ getSessionUser: async () => ({ id: "caller" }), createClient: async () => ({ storage: { from: () => ({ upload: fake.upload, getPublicUrl: fake.publicUrl }) }, from: () => ({ insert: (row: unknown) => { fake.insert(row); return { select: () => ({ single: async () => ({ data: { id: "media", tenant_id: "tenant" }, error: null }) }) }; } }) }) }));
vi.mock("@/lib/supabase/rpc", () => ({ getProjectById: async () => ({ data: { tenant_id: "tenant" } }) }));
vi.mock("@/lib/auth/tenant", () => ({ hasMinRole: async () => true }));
vi.mock("@/lib/api/engine", () => ({ MEDIA_BUCKET: "media", createAnalysisJob: async () => ({ id: "job" }) }));
import { POST } from "./route";
describe("private project upload", () => {
  it("creates a private bucket and persists an object path for guarded previews", async () => {
    const project = "00000000-0000-4000-8000-000000000001";
    const form = new FormData(); form.append("file", new Blob(["synthetic"], { type: "image/png" }), "fixture.png");
    const response = await POST({ headers: new Headers(), formData: async () => form } as Request, { params: Promise.resolve({ id: project }) });
    expect(response.status).toBe(200); expect(fake.bucket).toHaveBeenCalledWith("media", { public: false });
    const stored = fake.insert.mock.calls[0][0]; expect(stored.file_url).toMatch(new RegExp(`^${project}/[0-9a-f-]+\\.png$`));
    expect(fake.publicUrl).not.toHaveBeenCalled(); expect(fake.upload).toHaveBeenCalledWith(stored.file_url, expect.any(Blob), { upsert: false });
  });
});
