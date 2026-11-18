import { describe, expect, it } from "vitest";
import {
  extractMediaPathFromStorageUrl,
  isStorageObjectPath,
  pathInMediaBucket,
  publicMediaObjectUrl,
} from "./media-path";

describe("media-path", () => {
  it("strips leading media/ bucket prefix", () => {
    expect(pathInMediaBucket("media/tenant/session/file.jpg")).toBe("tenant/session/file.jpg");
    expect(pathInMediaBucket("tenant/session/file.jpg")).toBe("tenant/session/file.jpg");
  });

  it("builds public URL without double media prefix", () => {
    const url = publicMediaObjectUrl(
      "https://example.supabase.co",
      "media/t1/s1/file.jpg"
    );
    expect(url).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/t1/s1/file.jpg"
    );
    expect(url).not.toContain("/media/media/");
  });

  it("extracts path from our public storage URL including legacy double prefix", () => {
    const supabase = "https://abc.supabase.co";
    expect(
      extractMediaPathFromStorageUrl(
        `${supabase}/storage/v1/object/public/media/media/t1/s1/a.jpg`,
        supabase
      )
    ).toBe("t1/s1/a.jpg");
    expect(
      extractMediaPathFromStorageUrl(
        `${supabase}/storage/v1/object/public/media/t1/s1/a.jpg`,
        supabase
      )
    ).toBe("t1/s1/a.jpg");
  });

  it("rejects external URLs", () => {
    expect(
      extractMediaPathFromStorageUrl("https://evil.example/img.jpg", "https://abc.supabase.co")
    ).toBeNull();
    expect(isStorageObjectPath("https://evil.example/img.jpg")).toBe(false);
  });
});
