import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/help/query", () => {
  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new Request("https://x/api/v1/help/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid_json" });
  });

  it("returns 400 when query is empty", async () => {
    const res = await POST(
      new Request("https://x/api/v1/help/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "  ", locale: "ru" }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "query_required" });
  });

  it("returns an answer for a matching knowledge-base query", async () => {
    const res = await POST(
      new Request("https://x/api/v1/help/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "project setup", locale: "en", role: "manager" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toBeTruthy();
    expect(typeof body.answer.title).toBe("string");
    expect(Array.isArray(body.suggestions)).toBe(true);
  });
});
