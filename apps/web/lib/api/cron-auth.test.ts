import { afterEach, describe, expect, it } from "vitest";
import { isCronSecretRequired, requireCronSecretIfEnabled } from "./cron-auth";

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

  it("cannot disable production-mode protection with the legacy false flag", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", REQUIRE_CRON_SECRET: "false" };
    expect(isCronSecretRequired()).toBe(true);
  });

  it("allows an explicit false flag for local development", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development", REQUIRE_CRON_SECRET: "false" };
    expect(isCronSecretRequired()).toBe(false);
  });

  it("fails closed before cron work when production has no secret", async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", REQUIRE_CRON_SECRET: "false" };
    delete process.env.CRON_SECRET;
    const response = requireCronSecretIfEnabled(new Request("https://staging.aistroyka.ai/api/v1/admin/jobs/cron-tick"));
    expect(response?.status).toBe(503);
    expect((await response!.json()).code).toBe("cron_secret_misconfigured");
  });

  it("requires the configured secret even if a staging false flag survives", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", REQUIRE_CRON_SECRET: "false", CRON_SECRET: "fixture-cron-key" };
    const url = "https://staging.aistroyka.ai/api/v1/admin/jobs/cron-tick";
    expect(requireCronSecretIfEnabled(new Request(url))?.status).toBe(403);
    expect(requireCronSecretIfEnabled(new Request(url, { headers: { "x-cron-secret": "wrong" } }))?.status).toBe(403);
    expect(requireCronSecretIfEnabled(new Request(url, { headers: { "x-cron-secret": "fixture-cron-key" } }))).toBeNull();
  });

  it("still supports a required secret in local development", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development", REQUIRE_CRON_SECRET: "true", CRON_SECRET: "fixture-cron-key" };
    expect(isCronSecretRequired()).toBe(true);
  });
});
