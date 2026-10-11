import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ ctx: vi.fn(), doc: vi.fn(), download: vi.fn(), sign: vi.fn() }));
vi.mock("@/lib/tenant", () => ({ getTenantContextFromRequest: mocks.ctx, requireTenant: vi.fn(), TenantRequiredError: class extends Error {}, TenantForbiddenError: class extends Error {} }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: async () => ({
  storage: { from: () => ({ download: mocks.download, createSignedUrl: mocks.sign }) },
  from: (table: string) => ({ select() { return this; }, eq() { return this; }, maybeSingle: () => table === "projects" ? Promise.resolve({ data: { id: "project" }, error: null }) : mocks.doc() }),
}) }));
vi.mock("@/lib/tenant/tenant.policy", () => ({ canReadProjects: (ctx: { role?: string }) => ctx.role !== "stakeholder" }));
import { GET } from "./route";
const tenant = "00000000-0000-4000-8000-000000000001", project = "00000000-0000-4000-8000-000000000002", docId = "00000000-0000-4000-8000-000000000003";
const doc = { id: docId, tenant_id: tenant, project_id: project, object_path: `${tenant}/${project}/documents/file.pdf`, updated_at: "2026-10-11" };
const call = (id = project) => GET(new Request("https://test/api"), { params: Promise.resolve({ id, documentId: docId }) });
beforeEach(() => { vi.clearAllMocks(); mocks.ctx.mockResolvedValue({ tenantId: tenant, userId: "owner" }); mocks.doc.mockResolvedValue({ data: { ...doc }, error: "" }); mocks.sign.mockResolvedValue({ data: { signedUrl: "server-only-synthetic" }, error: null }); mocks.download.mockResolvedValue({ data: new Blob(["synthetic PDF"], { type: "application/pdf" }), error: null }); });
describe("authenticated private document gateway", () => {
  it("returns scoped PDF bytes with uncached inline preview", async () => {
    const r = await call(); expect(r.status).toBe(200); expect(await r.text()).toBe("synthetic PDF");
    expect(mocks.download).toHaveBeenCalledWith(doc.object_path); expect(mocks.ctx).toHaveBeenCalledTimes(2);
    expect(r.headers.get("cache-control")).toContain("no-store"); expect(r.headers.get("content-disposition")).toContain("inline;"); expect(r.headers.get("location")).toBeNull();
  });
  it("denies malformed ids before access", async () => { expect((await call("../other")).status).toBe(400); expect(mocks.ctx).not.toHaveBeenCalled(); });
  it("preserves role denial and missing document", async () => {
    mocks.ctx.mockResolvedValue({ tenantId: tenant, userId: "owner", role: "stakeholder" }); expect((await call()).status).toBe(403); expect(mocks.download).not.toHaveBeenCalled();
    mocks.ctx.mockResolvedValue({ tenantId: tenant, userId: "owner" }); mocks.doc.mockResolvedValue({ data: null, error: null }); expect((await call()).status).toBe(404);
  });
  it.each([`${tenant}/${docId}/documents/foreign.pdf`, `${docId}/foreign.pdf`, "https://foreign.test/file.pdf", `${tenant}/${project}/documents/../foreign.pdf`])("rejects source outside document/project scope %s", async (path) => {
    mocks.doc.mockResolvedValue({ data: { ...doc, object_path: path }, error: "" }); expect((await call()).status).toBe(404); expect(mocks.download).not.toHaveBeenCalled();
  });
  it("denies current source or access changes after I/O", async () => {
    mocks.doc.mockResolvedValueOnce({ data: { ...doc }, error: "" }).mockResolvedValueOnce({ data: { ...doc, updated_at: "changed" }, error: "" }); expect((await call()).status).toBe(404);
    mocks.doc.mockResolvedValue({ data: { ...doc }, error: "" }); mocks.ctx.mockResolvedValueOnce({ tenantId: tenant, userId: "owner" }).mockResolvedValueOnce({ tenantId: "other", userId: "owner" }); expect((await call()).status).toBe(403);
  });
  it("keeps Storage failure explicit and sanitized", async () => {
    mocks.download.mockResolvedValue({ data: null, error: { message: "private-storage-error" } }); const r = await call(); expect(r.status).toBe(503); expect(await r.text()).not.toContain("private-storage-error");
  });
  it("downloads non-preview types as attachments with their stored extension", async () => {
    mocks.doc.mockResolvedValue({ data: { ...doc, object_path: `${tenant}/${project}/documents/file.docx` }, error: null });
    mocks.download.mockResolvedValue({ data: new Blob(["synthetic"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), error: null }); const r = await call(); expect(r.status).toBe(200); expect(r.headers.get("content-disposition")).toContain(`attachment; filename="${docId}.docx"`); expect(r.headers.get("x-content-type-options")).toBe("nosniff");
  });
  it("does not disguise DB or current Storage policy failures as successful originals", async () => {
    mocks.doc.mockResolvedValueOnce({ data: null, error: { message: "private DB failure" } }); expect((await call()).status).toBe(503);
    mocks.sign.mockResolvedValue({ data: null, error: { message: "current policy denies read" } }); expect((await call()).status).toBe(503);
  });

});
