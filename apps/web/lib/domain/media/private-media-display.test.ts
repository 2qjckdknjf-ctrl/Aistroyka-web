import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAIMediaImage } from "@/lib/platform/ai/resolve-ai-media-image";
import { privateMediaDisplayUrl } from "./private-media-display";
vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({ resolveAIMediaImage: vi.fn() }));
const client = {} as SupabaseClient;
const input = { tenantId: "tenant", reportId: "report", mediaId: "media", uploadSessionId: "session" };
beforeEach(() => vi.clearAllMocks());
describe("private contractor previews", () => {
  it("uses the caller's client and full lineage instead of manufacturing public URLs", async () => {
    vi.mocked(resolveAIMediaImage).mockResolvedValue({ ok: true, imageUrl: "https://storage.test/signed", objectPath: "tenant/source", trustedProjectId: "project", source: "media" });
    expect(await privateMediaDisplayUrl(client, input)).toBe("https://storage.test/signed");
    expect(resolveAIMediaImage).toHaveBeenCalledWith(client, input);
  });
  it("does not hide retryable source failures behind unavailable success", async () => {
    vi.mocked(resolveAIMediaImage).mockResolvedValue({ ok: false, retryable: true, code: "AI_MEDIA_STORAGE_TEMPORARY", message: "synthetic" });
    await expect(privateMediaDisplayUrl(client, input)).rejects.toThrow("temporarily unavailable");
  });
  it("does not return raw paths for missing or denied media", async () => {
    vi.mocked(resolveAIMediaImage).mockResolvedValue({ ok: false, retryable: false, code: "AI_MEDIA_ACCESS_DENIED", message: "synthetic" });
    expect(await privateMediaDisplayUrl(client, input)).toBeNull();
  });
});
