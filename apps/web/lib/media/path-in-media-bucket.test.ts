import { describe, expect, it } from "vitest";
import { pathInMediaBucket, publicMediaObjectUrl } from "./path-in-media-bucket";

describe("pathInMediaBucket", () => {
  it("strips a leading media/ bucket prefix", () => {
    expect(pathInMediaBucket("media/t1/s1/a.jpg")).toBe("t1/s1/a.jpg");
  });

  it("leaves bare in-bucket paths unchanged", () => {
    expect(pathInMediaBucket("t1/s1/a.jpg")).toBe("t1/s1/a.jpg");
  });
});

describe("publicMediaObjectUrl", () => {
  it("does not double the media bucket segment for upload-session object_path", () => {
    expect(publicMediaObjectUrl("https://example.supabase.co", "media/t1/s1/a.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/t1/s1/a.jpg"
    );
  });

  it("works for bare in-bucket paths", () => {
    expect(publicMediaObjectUrl("https://example.supabase.co/", "t1/s1/a.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/t1/s1/a.jpg"
    );
  });
});
