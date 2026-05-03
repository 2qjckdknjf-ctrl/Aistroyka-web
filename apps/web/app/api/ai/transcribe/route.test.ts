import { describe, expect, it, vi } from "vitest";

vi.mock("../../v1/ai/transcribe/route", () => ({
  dynamic: "force-dynamic",
  POST: vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
}));

describe("POST /api/ai/transcribe (legacy route)", () => {
  it("re-exports dynamic mode and delegates to v1 handler", async () => {
    const legacy = await import("./route");
    const v1 = await import("../../v1/ai/transcribe/route");
    expect(legacy.dynamic).toBe("force-dynamic");

    const req = new Request("https://x/api/ai/transcribe", { method: "POST", body: new FormData() });
    const res = await legacy.POST(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(v1.POST)).toHaveBeenCalledTimes(1);
  });
});
