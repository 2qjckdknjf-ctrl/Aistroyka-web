import { afterEach, describe, expect, it } from "vitest";
import { hasValidCronSecret, isCronSecretRequired } from "./cron-auth";

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

  it("respects explicit override REQUIRE_CRON_SECRET=false", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", REQUIRE_CRON_SECRET: "false" };
    expect(isCronSecretRequired()).toBe(false);
  });

  it("hasValidCronSecret is true only when header matches configured secret", () => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: "s3cret" };
    const ok = new Request("http://test", { headers: { "x-cron-secret": "s3cret" } });
    const bad = new Request("http://test", { headers: { "x-cron-secret": "nope" } });
    const missing = new Request("http://test");
    expect(hasValidCronSecret(ok)).toBe(true);
    expect(hasValidCronSecret(bad)).toBe(false);
    expect(hasValidCronSecret(missing)).toBe(false);
  });

  it("hasValidCronSecret is false when CRON_SECRET is unset", () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.CRON_SECRET;
    const req = new Request("http://test", { headers: { "x-cron-secret": "anything" } });
    expect(hasValidCronSecret(req)).toBe(false);
  });
});
