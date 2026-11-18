import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: () => ({}) }));
vi.mock("@/lib/domain/proof-pack/proof-media.service", async original => ({ ...await original<typeof import("@/lib/domain/proof-pack/proof-media.service")>(), downloadSharedProofMedia: mocks.download }));
import { GET } from "./route";
import { ProofMediaError } from "@/lib/domain/proof-pack/proof-media.service";
const id = "00000000-0000-4000-8000-000000000002";
const call = (mediaId = id) => GET(new Request("https://example.test/api"), { params: Promise.resolve({ token: "exact-token", mediaId }) });
beforeEach(() => { vi.clearAllMocks(); mocks.download.mockResolvedValue(new Blob(["bytes"], { type: "image/png" })); });
describe("proof original HTTP response", () => {
  it("streams private bytes with no redirect/cache", async () => {
    const r = await call(); expect(r.status).toBe(200); expect(await r.text()).toBe("bytes"); expect(r.headers.get("cache-control")).toContain("no-store"); expect(r.headers.get("location")).toBeNull(); expect(r.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("keeps denied originals uncached", async () => {
    mocks.download.mockRejectedValue(new ProofMediaError(404)); const r = await call(); expect(r.status).toBe(404); expect(r.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
  });
  it("rejects malformed ids before source access and sanitizes failures", async () => {
    expect((await call("another/path")).status).toBe(400); expect(mocks.download).not.toHaveBeenCalled();
    mocks.download.mockRejectedValue(new Error("secret-db-path")); const r = await call(); expect(r.status).toBe(503); expect(await r.text()).not.toContain("secret-db-path");
  });
});
