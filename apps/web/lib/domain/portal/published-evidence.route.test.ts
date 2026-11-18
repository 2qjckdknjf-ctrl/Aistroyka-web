import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishedEvidenceResponse } from "./published-evidence.route";
import { PublishedEvidenceError } from "./published-evidence.service";
const mocks = vi.hoisted(() => ({ list: vi.fn(), download: vi.fn(), tenant: vi.fn(), require: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/tenant", () => ({ getTenantContextFromRequest: mocks.tenant, requireTenant: mocks.require, TenantRequiredError: class extends Error {}, TenantForbiddenError: class extends Error {} }));
vi.mock("./published-evidence.service", async importOriginal => ({ ...await importOriginal<typeof import("./published-evidence.service")>(), listPublishedEvidence: mocks.list, downloadPublishedEvidence: mocks.download }));
const pid = "00000000-0000-4000-8000-000000000301", eid = "00000000-0000-4000-8000-000000000801";
const request = () => new Request(`https://staging.aistroyka.ai/api/v1/portal/projects/${pid}/evidence`);
beforeEach(() => { vi.clearAllMocks(); mocks.tenant.mockResolvedValue({ tenantId: "t1", userId: "u1" }); mocks.list.mockResolvedValue({ items: [] }); mocks.download.mockResolvedValue(new Blob(["bytes"], { type: "image/jpeg" })); });
describe("published evidence HTTP boundary", () => {
  it("sets private/no-store headers on metadata", async () => {
    const res = await publishedEvidenceResponse(request(), pid);
    expect(res.status).toBe(200); expect(res.headers.get("cache-control")).toContain("no-store"); expect(res.headers.get("vary")).toContain("Authorization"); expect(res.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
  });
  it("returns bytes without Location and forbids caching originals", async () => {
    const res = await publishedEvidenceResponse(request(), pid, eid);
    expect(res.status).toBe(200); expect(await res.text()).toBe("bytes"); expect(res.headers.get("location")).toBeNull(); expect(res.headers.get("cache-control")).toContain("private, no-store"); expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });
  it("keeps withdrawal errors uncached", async () => {
    mocks.download.mockRejectedValue(new PublishedEvidenceError(404, "Original not available"));
    const res = await publishedEvidenceResponse(request(), pid, eid);
    expect(res.status).toBe(404); expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects malformed identifiers before tenant/admin work", async () => {
    expect((await publishedEvidenceResponse(request(), "bad-id")).status).toBe(400); expect(mocks.tenant).not.toHaveBeenCalled();
  });
  it("sanitizes unexpected failures", async () => {
    mocks.list.mockRejectedValue(new Error("private-token-and-db-detail"));
    const res = await publishedEvidenceResponse(request(), pid);
    expect(res.status).toBe(503); expect(await res.text()).not.toContain("private-token");
  });
});
