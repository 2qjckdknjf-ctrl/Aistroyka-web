import { describe, expect, it, vi } from "vitest";
import {
  assertPortalMediaPayloadSafe,
  projectSignedMediaForEvidence,
} from "./portal-media-projection.service";

vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({
  AI_MEDIA_SIGNED_URL_TTL_SEC: 900,
  resolveAIMediaImage: vi.fn(async (_sb, input) => {
    if (input.tenantId === "tenant-b") {
      return { ok: false, code: "AI_MEDIA_ACCESS_DENIED", retryable: false, message: "denied" };
    }
    return {
      ok: true,
      imageUrl: "https://signed.example/photo",
      source: "media",
      objectPath: "tenant-a/x.jpg",
      trustedProjectId: "p1",
    };
  }),
  createSignedUrlForPath: vi.fn(),
}));

describe("portal-media-projection", () => {
  it("returns null when evidence not owner visible", async () => {
    const result = await projectSignedMediaForEvidence({} as never, "tenant-a", "p1", {
      media_id: "m1",
      upload_session_id: null,
      report_id: "r1",
      owner_visible: false,
      project_id: "p1",
    });
    expect(result.signed_url).toBeNull();
    expect(result.unavailable_reason).toBe("not_owner_visible");
  });

  it("blocks cross-tenant signing", async () => {
    const result = await projectSignedMediaForEvidence({} as never, "tenant-b", "p1", {
      media_id: "m1",
      upload_session_id: null,
      report_id: "r1",
      owner_visible: true,
      project_id: "p1",
    });
    expect(result.signed_url).toBeNull();
  });

  it("returns signed url for visible evidence", async () => {
    const result = await projectSignedMediaForEvidence({} as never, "tenant-a", "p1", {
      media_id: "m1",
      upload_session_id: null,
      report_id: "r1",
      owner_visible: true,
      project_id: "p1",
    });
    expect(result.signed_url).toBe("https://signed.example/photo");
    expect(result.expires_in_sec).toBe(900);
  });

  it("assertPortalMediaPayloadSafe rejects storage paths", () => {
    expect(assertPortalMediaPayloadSafe({ items: [{ object_path: "secret" }] })).toBe(false);
    expect(assertPortalMediaPayloadSafe({ items: [{ signed_image_url: "https://signed/x" }] })).toBe(
      true
    );
  });
});
