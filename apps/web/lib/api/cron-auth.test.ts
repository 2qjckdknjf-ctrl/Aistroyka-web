import { afterEach, describe, expect, it } from "vitest";
import { isCronSecretRequired } from "./cron-auth";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("cron-auth", () => {
  it("requires cron secret in production by default", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production" };
    delete process.env.REQUIRE_CRON_SECRET;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(isCronSecretRequired()).toBe(true);
  });

  it("does not require cron secret in non-production by default", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" };
    delete process.env.REQUIRE_CRON_SECRET;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(isCronSecretRequired()).toBe(false);
  });

  it("respects explicit override REQUIRE_CRON_SECRET=false outside public deploy envs", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      REQUIRE_CRON_SECRET: "false",
    };
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(isCronSecretRequired()).toBe(false);
  });

  it("ignores REQUIRE_CRON_SECRET=false on staging app env (never fail-open)", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_ENV: "staging",
      REQUIRE_CRON_SECRET: "false",
    };
    expect(isCronSecretRequired()).toBe(true);
  });

  it("requires cron secret on production app env even when REQUIRE unset", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "production",
    };
    delete process.env.REQUIRE_CRON_SECRET;
    expect(isCronSecretRequired()).toBe(true);
  });
});
