import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveWorkerDocumentOpenUrl } from "./worker-document-open-url";

const createSignedUrlForPath = vi.fn();

vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({
  createSignedUrlForPath: (...args: unknown[]) => createSignedUrlForPath(...args),
}));

const supabase = {} as SupabaseClient;

describe("resolveWorkerDocumentOpenUrl", () => {
  it("returns an existing http(s) path without signing", async () => {
    const url = await resolveWorkerDocumentOpenUrl(
      supabase,
      "tenant-1",
      "https://files.example/kj-07.pdf"
    );
    expect(url).toBe("https://files.example/kj-07.pdf");
    expect(createSignedUrlForPath).not.toHaveBeenCalled();
  });

  it("signs a tenant-guarded storage path", async () => {
    createSignedUrlForPath.mockResolvedValueOnce({
      ok: true,
      imageUrl: "https://signed.example/act.pdf",
    });
    const url = await resolveWorkerDocumentOpenUrl(
      supabase,
      "tenant-1",
      "tenant-1/proj-1/documents/act.pdf"
    );
    expect(url).toBe("https://signed.example/act.pdf");
    expect(createSignedUrlForPath).toHaveBeenCalledWith(supabase, "tenant-1/proj-1/documents/act.pdf", {
      tenantId: "tenant-1",
    });
  });

  it("returns null when the path is empty or signing is denied", async () => {
    expect(await resolveWorkerDocumentOpenUrl(supabase, "tenant-1", "")).toBeNull();
    createSignedUrlForPath.mockResolvedValueOnce({ ok: false });
    expect(await resolveWorkerDocumentOpenUrl(supabase, "tenant-1", "other/secret.pdf")).toBeNull();
  });
});
