import { describe, expect, it } from "vitest";
import { nextSolutionRoleOnKey, parseSolutionRole, SOLUTION_ROLES, solutionsRoleHref } from "./solutions-roles";

describe("Solutions tab keyboard behavior", () => {
  it("parses deep-link roles and falls back to business", () => {
    expect(parseSolutionRole("manager")).toBe("manager");
    expect(parseSolutionRole("field")).toBe("field");
    expect(parseSolutionRole("business")).toBe("business");
    expect(parseSolutionRole("owner")).toBe("business");
    expect(parseSolutionRole(null)).toBe("business");
  });

  it("moves across tabs with arrows, Home and End", () => {
    expect(nextSolutionRoleOnKey("business", "ArrowRight")).toBe("manager");
    expect(nextSolutionRoleOnKey("manager", "ArrowRight")).toBe("field");
    expect(nextSolutionRoleOnKey("field", "ArrowRight")).toBe("business");
    expect(nextSolutionRoleOnKey("business", "ArrowLeft")).toBe("field");
    expect(nextSolutionRoleOnKey("manager", "Home")).toBe("business");
    expect(nextSolutionRoleOnKey("business", "End")).toBe("field");
    expect(nextSolutionRoleOnKey("field", "ArrowUp")).toBe("manager");
    expect(nextSolutionRoleOnKey("business", "Enter")).toBeNull();
  });

  it("keeps a stable three-role model", () => {
    expect(SOLUTION_ROLES).toEqual(["business", "manager", "field"]);
  });

  it("writes role onto the current solutions path", () => {
    expect(solutionsRoleHref("/ru/solutions", "field")).toBe("/ru/solutions?role=field");
    expect(solutionsRoleHref("/ru/solutions?role=manager", "field")).toBe("/ru/solutions?role=field");
  });
});
