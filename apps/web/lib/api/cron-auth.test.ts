import { afterEach, describe, expect, it } from "vitest";
import { CRON_UNAUTHORIZED_CODE, isCronSecretRequired, requireCronSecretIfEnabled } from "./cron-auth";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("cron-auth", () => {
  it("requires cron secret in production by default", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production" };
    delete process.env.REQUIRE_CRON_SECRET;
    expect(isCronSecretRequired()).toBe(true);
  });

  it("does not require cron secret in non-production by default", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" };
    delete process.env.REQUIRE_CRON_SECRET;
    expect(isCronSecretRequired()).toBe(false);
  });

  it("respects explicit override REQUIRE_CRON_SECRET=false outside deployed runtimes", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development", REQUIRE_CRON_SECRET: "false" };
    expect(isCronSecretRequired()).toBe(false);
  });

  it("requires cron secret in production even when REQUIRE_CRON_SECRET=false is set", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", REQUIRE_CRON_SECRET: "false" };
    expect(isCronSecretRequired()).toBe(true);
  });

  it("treats NEXT_PUBLIC_APP_ENV=staging as deployed and blocks missing secrets", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "staging",
      REQUIRE_CRON_SECRET: "false",
      CRON_SECRET: "secret123",
    };

    const res = requireCronSecretIfEnabled(new Request("https://staging.aistroyka.ai/api/v1/admin/jobs/cron-tick"));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toMatchObject({ code: CRON_UNAUTHORIZED_CODE });
  });
});
