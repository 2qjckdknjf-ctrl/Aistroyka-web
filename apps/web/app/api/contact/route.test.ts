import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

describe("POST /api/contact", () => {
  it("returns 400 when name is missing", async () => {
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@b.co", message: "Hi" }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Jane", email: "not-email", message: "Hi" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when message is empty", async () => {
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Jane", email: "j@b.co", message: "" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 200 and inserts with source and status when valid", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane@example.com",
          company: "Acme",
          message: "Hello",
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      company: "Acme",
      message: "Hello",
      source: "contact_form",
      status: "new",
    });
  });

  it("returns 200 and inserts with null company when company omitted", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", email: "bob@b.co", message: "Hi" }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bob",
        email: "bob@b.co",
        message: "Hi",
        company: null,
        source: "contact_form",
        status: "new",
      })
    );
  });

  it("returns 500 when getAdminClient returns null", async () => {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(getAdminClient).mockReturnValueOnce(null as never);
    const res = await POST(
      new Request("http://x/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x", email: "x@x.co", message: "x" }),
      })
    );
    expect(res.status).toBe(500);
  });
});
