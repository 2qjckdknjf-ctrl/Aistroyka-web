import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: fromMock,
    auth: { getUser: vi.fn() },
  }),
  getSessionUser: vi.fn().mockResolvedValue({ id: "u1", email: "invitee@example.com" }),
}));

describe("POST /api/v1/tenant/accept-invite", () => {
  it("returns 503 when invitations table is missing", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "tenant_invitations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: "Could not find the table 'public.tenant_invitations' in the schema cache",
                },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("https://x/api/v1/tenant/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "550e8400-e29b-41d4-a716-446655440000" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("migrations");
  });
});
