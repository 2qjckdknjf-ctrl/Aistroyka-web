import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LEGACY_API_HEADERS } from "@/lib/api/deprecation-headers";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => {
    throw new Error("legacy /api/contact must not touch admin client");
  }),
}));

vi.mock("@/lib/public/contact-lead-submit", () => ({
  insertContactLead: vi.fn(async () => {
    throw new Error("legacy /api/contact must not insert");
  }),
}));

vi.mock("@/lib/platform/rate-limit/public-contact-rate-limit", () => ({
  checkPublicContactRateLimit: vi.fn(async () => {
    throw new Error("legacy /api/contact must not rate-limit");
  }),
}));

import { POST } from "./route";

describe("POST /api/contact (legacy redirect)", () => {
  it("source is redirect-only with no business imports", () => {
    const src = readFileSync(join(process.cwd(), "app/api/contact/route.ts"), "utf8");
    expect(src).toMatch(/redirectDeprecatedApiToV1/);
    expect(src).not.toMatch(/insertContactLead|getAdminClient|checkPublicContactRateLimit|supabase/);
  });

  it("returns 307 to /api/v1/contact with query and deprecation headers", async () => {
    const req = new Request("https://x/api/contact?src=form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jane", email: "j@e.co", message: "Hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://x/api/v1/contact?src=form");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
    expect(res.headers.get("Link")).toBe('</api/v1/contact>; rel="successor"');
    expect(req.bodyUsed).toBe(false);
  });
});
