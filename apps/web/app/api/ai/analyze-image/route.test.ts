import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/analyze-image (legacy redirect)", () => {
  it("returns 403 for lite clients without redirect", async () => {
    const req = new Request("http://test/api/ai/analyze-image", {
      method: "POST",
      headers: { "x-client": "ios_lite", "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: "https://example.com/photo.jpg" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe("lite_client_path_forbidden");
  });

  it("redirects non-lite clients to v1 with deprecation headers", async () => {
    const req = new Request("http://test/api/ai/analyze-image?x=1", {
      method: "POST",
      headers: { "x-client": "web", "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: "https://example.com/photo.jpg" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://test/api/v1/ai/analyze-image?x=1");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBeDefined();
  });
});
