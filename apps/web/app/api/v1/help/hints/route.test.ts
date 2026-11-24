import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/help/hints", () => {
  it("returns hints for a known locale and role", async () => {
    const res = await POST(
      new Request("https://x/api/v1/help/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "ru", role: "manager", getStarted: {} }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.hints)).toBe(true);
    expect(body.hints.length).toBeGreaterThan(0);
  });

  it("returns an empty hints list for invalid JSON", async () => {
    const res = await POST(
      new Request("https://x/api/v1/help/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ hints: [] });
  });
});
