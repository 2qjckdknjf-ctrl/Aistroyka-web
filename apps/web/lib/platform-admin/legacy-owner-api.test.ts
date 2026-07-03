import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { delegateToPlatformApi } from "./legacy-owner-api";

describe("delegateToPlatformApi", () => {
  it("forwards handler response with deprecation headers", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: { ok: true } }, { status: 200 }));
    const request = new Request("https://x/api/v1/owner/health");
    const res = await delegateToPlatformApi(request, handler);
    expect(handler).toHaveBeenCalledWith(request);
    expect(res.status).toBe(200);
    expect(res.headers.get("Deprecation")).toBe("true");
  });
});
