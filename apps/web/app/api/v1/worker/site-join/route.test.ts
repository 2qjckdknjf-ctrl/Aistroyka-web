import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const acceptInvite = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { role: "member" } }), { status: 200 }));

vi.mock("@/app/api/v1/tenant/accept-invite/route", () => ({
  POST: (...args: unknown[]) => acceptInvite(...args),
}));

describe("POST /api/v1/worker/site-join", () => {
  it("forwards a token to the existing accept-invite contract", async () => {
    const req = new Request("https://test/api/v1/worker/site-join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "invite-token-value" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(acceptInvite).toHaveBeenCalled();
  });
});
