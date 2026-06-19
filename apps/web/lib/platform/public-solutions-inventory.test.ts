import { describe, expect, it } from "vitest";
import { PUBLIC_SOLUTION_ROLES } from "./public-solutions-inventory";

describe("public-solutions-inventory", () => {
  it("defines six role entry points", () => {
    expect(PUBLIC_SOLUTION_ROLES).toHaveLength(6);
    expect(PUBLIC_SOLUTION_ROLES.map((r) => r.key)).toEqual([
      "roleGeneralContractor",
      "roleProjectManager",
      "roleSiteManager",
      "roleWorker",
      "roleOwner",
      "roleStakeholder",
    ]);
  });

  it("keeps exactly one highlighted role card", () => {
    expect(PUBLIC_SOLUTION_ROLES.filter((r) => r.highlight)).toHaveLength(1);
    expect(PUBLIC_SOLUTION_ROLES[0]?.highlight).toBe(true);
  });
});
