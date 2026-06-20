import { describe, expect, it } from "vitest";
import {
  ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES,
  isAccountMemberEligibleTenantRole,
  tenantAccountSlug,
} from "./account-workspace.constants";

describe("account-workspace.constants", () => {
  it("eligible tenant roles exclude stakeholder", () => {
    expect(ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES).toContain("owner");
    expect(ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES).toContain("admin");
    expect(ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES).toContain("member");
    expect(ACCOUNT_MEMBER_ELIGIBLE_TENANT_ROLES).toContain("viewer");
    expect(isAccountMemberEligibleTenantRole("stakeholder")).toBe(false);
  });

  it("generates deterministic tenant slug", () => {
    expect(tenantAccountSlug("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "t-aaaaaaaabbbbccccddddeeeeeeeeeeee"
    );
  });
});
