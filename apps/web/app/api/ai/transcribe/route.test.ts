import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/transcribe (legacy redirect)", () => {
  it("returns 403 for lite clients and does not delegate to v1", async () => {
    const req = new Request("https://x/api/ai/transcribe", {
      method: "POST",
      headers: { "x-client": "android_lite" },
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("lite_client_path_forbidden");
  });

  it("redirects non-lite clients to canonical v1", async () => {
    const req = new Request("https://x/api/ai/transcribe", {
      method: "POST",
      headers: { "x-client": "ios_full" },
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://x/api/v1/ai/transcribe");
  });
});
