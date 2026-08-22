import { describe, expect, it } from "vitest";
import { validateJobsPayloadProjectTenant } from "./jobs-payload-tenant-guard";

describe("jobs-payload-tenant-guard", () => {
  const tenantA = "11111111-1111-4111-8111-111111111111";
  const projectA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  it("passes when project_id omitted", () => {
    expect(validateJobsPayloadProjectTenant(undefined, tenantA, () => false).ok).toBe(true);
  });

  it("fails on invalid uuid", () => {
    expect(validateJobsPayloadProjectTenant("bad", tenantA, () => true).ok).toBe(false);
  });

  it("fails when ownership callback returns false", () => {
    expect(
      validateJobsPayloadProjectTenant(projectA, tenantA, () => false).ok
    ).toBe(false);
  });
});
