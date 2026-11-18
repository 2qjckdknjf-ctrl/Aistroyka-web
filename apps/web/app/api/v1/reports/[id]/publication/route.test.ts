import { beforeEach, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";
const mock = vi.hoisted(() => ({ ctx: vi.fn(), client: vi.fn(), list: vi.fn(), set: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/observability/audit.service", () => ({ emitAudit: mock.audit }));
vi.mock("@/lib/tenant", async importOriginal => ({ ...await importOriginal<object>(), getTenantContextFromRequest: mock.ctx }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: mock.client }));
vi.mock("@/lib/domain/visual-evidence/report-publication.service", async importOriginal => ({ ...await importOriginal<object>(), listReportPublication: mock.list, setReportPublication: mock.set }));
const id = "00000000-0000-4000-8000-000000000011", attachment = "00000000-0000-4000-8000-000000000012";
const context = { params: Promise.resolve({ id }) };
beforeEach(() => {
  vi.resetAllMocks(); mock.ctx.mockResolvedValue({ tenantId: "tenant", userId: "manager", role: "owner" });
  mock.client.mockResolvedValue({}); mock.list.mockResolvedValue({ items: [] }); mock.set.mockResolvedValue({ published: true }); mock.audit.mockResolvedValue(undefined);
});
it("serves uncached publication state without writing on GET", async () => {
  const response = await GET(new Request("https://example.test/api"), context);
  expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toContain("no-store"); expect(mock.set).not.toHaveBeenCalled();
});
it("requires explicit visibility, attachment UUID and optimistic version", async () => {
  for (const body of [{}, { attachment_id: attachment, visible: true }, { attachment_id: "foreign", visible: true, expected_version: null }, { attachment_id: attachment, visible: "true", expected_version: null }, { attachment_id: attachment, visible: true, expected_version: "invalid" }]) {
    const response = await PATCH(new Request("https://example.test/api", { method: "PATCH", body: JSON.stringify(body) }), context);
    expect(response.status).toBe(400); expect(response.headers.get("Cache-Control")).toContain("no-store");
  }
  expect(mock.set).not.toHaveBeenCalled();
});
it("never accepts caller-supplied source identity or publication metadata", async () => {
  const response = await PATCH(new Request("https://example.test/api", { method: "PATCH", body: JSON.stringify({ attachment_id: attachment, visible: true, expected_version: null, media_id: "forged", tenant_id: "foreign", uploader_user_id: "manager", zone_label: "rewrite" }) }), context);
  expect(response.status).toBe(200);
  expect(mock.set.mock.calls[0][3]).toEqual({ attachmentId: attachment, visible: true, expectedVersion: null });
  expect(mock.audit.mock.calls[0][1].details).not.toHaveProperty("zone_label");
});
it("keeps unexpected DB/transport details private and errors uncached", async () => {
  mock.list.mockRejectedValue(new Error("secret signed URL")); const r = await GET(new Request("https://example.test/api"), context);
  expect(r.status).toBe(503); expect(await r.text()).not.toContain("secret"); expect(r.headers.get("Cache-Control")).toContain("no-store");
});
it("denies absent tenant before source access", async () => {
  mock.ctx.mockResolvedValue({ tenantId: null, userId: null, role: null });
  expect((await GET(new Request("https://example.test/api"), context)).status).toBe(401); expect(mock.list).not.toHaveBeenCalled();
});
