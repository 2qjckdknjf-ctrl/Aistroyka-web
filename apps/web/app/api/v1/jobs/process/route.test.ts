import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { CRON_UNAUTHORIZED_CODE } from "@/lib/api/cron-auth";

describe("POST /api/v1/jobs/process", () => {
  it("returns 403 with cron_unauthorized when REQUIRE_CRON_SECRET is true and x-cron-secret is missing", async () => {
    vi.stubEnv("REQUIRE_CRON_SECRET", "true");
    vi.stubEnv("CRON_SECRET", "secret123");
    const req = new Request("https://test/api/v1/jobs/process", {
      method: "POST",
      headers: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe(CRON_UNAUTHORIZED_CODE);
  });

  it("returns 403 with cron_unauthorized when REQUIRE_CRON_SECRET is true and x-cron-secret is wrong", async () => {
    vi.stubEnv("REQUIRE_CRON_SECRET", "true");
    vi.stubEnv("CRON_SECRET", "secret123");
    const req = new Request("https://test/api/v1/jobs/process", {
      method: "POST",
      headers: { "x-cron-secret": "wrong" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe(CRON_UNAUTHORIZED_CODE);
  });

});
