import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublishedPortalPhotos, PortalPhotosError } from "./portal-published-evidence";
const project = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000002";
const original = `/api/v1/portal/projects/${project}/evidence/${id}/original`;
const row = { id, original_url: original, zone_label: "Kitchen", manager_verified: true };
const response = (items: unknown[], projectId = project) => ({ ok: true, json: async () => ({ data: { project: { id: projectId }, items } }) });
afterEach(() => vi.unstubAllGlobals());
describe("published portal photo reader", () => {
  it("uses the authenticated no-store gateway and strips unexpected fields", async () => {
    const fetch = vi.fn().mockResolvedValue(response([{ ...row, internal_cost: 100, uploader_user_id: "private" }]));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchPublishedPortalPhotos(project)).toEqual([row]);
    expect(fetch).toHaveBeenCalledWith(`/api/v1/portal/projects/${project}/evidence`, expect.objectContaining({ credentials: "include", cache: "no-store" }));
  });
  it.each([401, 403, 404, 503])("preserves HTTP %s rather than returning empty success", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(fetchPublishedPortalPhotos(project)).rejects.toMatchObject({ status });
  });
  it.each(["https://example.test/raw.png", `/api/v1/portal/projects/another/evidence/${id}/original`, original + "?token=raw"])("rejects original outside the exact gateway: %s", async (url) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([{ ...row, original_url: url }])));
    await expect(fetchPublishedPortalPhotos(project)).rejects.toBeInstanceOf(PortalPhotosError);
  });
  it("rejects another project and unverified sources", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response([row], "another")).mockResolvedValueOnce(response([{ ...row, manager_verified: false }]));
    vi.stubGlobal("fetch", fetch);
    await expect(fetchPublishedPortalPhotos(project)).rejects.toBeInstanceOf(PortalPhotosError);
    await expect(fetchPublishedPortalPhotos(project)).rejects.toBeInstanceOf(PortalPhotosError);
  });
  it("accepts a real empty publication set", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
    expect(await fetchPublishedPortalPhotos(project)).toEqual([]);
  });
});
