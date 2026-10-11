import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadSharedProofMedia } from "./proof-media.service";
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({ resolveAIMediaImage: mocks.resolve }));
let tables: Record<string, Record<string, unknown> | null>, failing: string | null;
const filters: Array<[string, string, unknown]> = [];
const admin = {
  from: (table: string) => ({ select() { return this; }, eq(key: string, value: unknown) { filters.push([table, key, value]); return this; }, maybeSingle: async () => ({ data: tables[table], error: failing === table ? { message: "private failure" } : null }) }),
  storage: { from: () => ({ download: mocks.download }) },
} as unknown as SupabaseClient;
beforeEach(() => {
  vi.clearAllMocks(); filters.length = 0; failing = null;
  tables = { proof_pack_shares: { tenant_id: "t1", project_id: "p1", revoked_at: null, expires_at: null }, tenants: { account_id: "a1" }, accounts: { status: "active" }, media: { id: "m1", tenant_id: "t1", project_id: "p1", type: "image", file_url: "p1/image.png" } };
  mocks.resolve.mockResolvedValue({ ok: true, trustedProjectId: "p1", objectPath: "p1/image.png" });
  mocks.download.mockResolvedValue({ data: new Blob(["synthetic"], { type: "image/png" }), error: null });
});
describe("token-scoped private proof originals", () => {
  it("returns actual image bytes and scopes both source reads to the token project/tenant", async () => {
    expect(await (await downloadSharedProofMedia(admin, "exact-token", "m1")).text()).toBe("synthetic");
    expect(filters).toContainEqual(["media", "tenant_id", "t1"]); expect(filters).toContainEqual(["media", "project_id", "p1"]);
    expect(mocks.resolve).toHaveBeenCalledWith(admin, { tenantId: "t1", projectIdClaim: "p1", mediaId: "m1" });
  });
  it.each(["proof_pack_shares", "tenants", "accounts", "media"])("preserves %s DB failures as503", async (table) => {
    failing = table; await expect(downloadSharedProofMedia(admin, "token", "m1")).rejects.toMatchObject({ status: 503 }); expect(mocks.download).not.toHaveBeenCalled();
  });
  it.each([
    ["proof_pack_shares", null], ["proof_pack_shares", { tenant_id: "t1", project_id: "p1", revoked_at: "now" }],
    ["proof_pack_shares", { tenant_id: "t1", project_id: "p1", expires_at: "2020-01-01" }],
    ["accounts", { status: "suspended" }], ["media", null], ["media", { type: "internal_image" }],
  ])("denies missing/revoked/expired/inactive/private source %#", async (table, value) => {
    tables[table as string] = value as Record<string, unknown> | null;
    await expect(downloadSharedProofMedia(admin, "token", "m1")).rejects.toMatchObject({ status: 404 }); expect(mocks.download).not.toHaveBeenCalled();
  });
  it.each(["grant", "account", "source"])("rechecks %s after Storage I/O", async (kind) => {
    mocks.download.mockImplementation(async () => {
      if (kind === "grant") tables.proof_pack_shares!.revoked_at = "now";
      if (kind === "account") tables.accounts!.status = "suspended";
      if (kind === "source") tables.media = { ...tables.media, file_url: "p1/rebound.png" };
      return { data: new Blob(["synthetic"], { type: "image/png" }), error: null };
    });
    await expect(downloadSharedProofMedia(admin, "token", "m1")).rejects.toMatchObject({ status: 404 });
  });
  it("rejects a resolver from a different project", async () => {
    mocks.resolve.mockResolvedValue({ ok: true, trustedProjectId: "another" });
    await expect(downloadSharedProofMedia(admin, "token", "m1")).rejects.toMatchObject({ status: 404 }); expect(mocks.download).not.toHaveBeenCalled();
  });
  it("rejects unsupported blob content", async () => {
    mocks.download.mockResolvedValue({ data: new Blob(["html"], { type: "text/html" }), error: null });
    await expect(downloadSharedProofMedia(admin, "token", "m1")).rejects.toMatchObject({ status: 415 });
  });
});
