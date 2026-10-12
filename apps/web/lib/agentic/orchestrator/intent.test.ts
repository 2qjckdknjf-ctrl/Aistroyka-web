import { describe, expect, it } from "vitest";
import { resolveAgentIntent, skillsForIntent, isRequiredSkill } from "./intent";

describe("intent routing", () => {
  it("maps delivery-threat questions to the required skill pack", () => {
    expect(resolveAgentIntent("Что сейчас угрожает сдаче этого проекта?")).toBe("delivery_threat");
    const skills = skillsForIntent("delivery_threat");
    expect(skills).toContain("get_project_state");
    expect(skills).toContain("get_overdue_tasks");
    expect(skills).toContain("get_open_issues");
    expect(skills).toContain("find_project_blockers");
    expect(skills).toContain("calculate_project_health");
  });

  it("treats get_project_members as optional, not required for overdue intent", () => {
    expect(isRequiredSkill("overdue_tasks", "get_overdue_tasks")).toBe(true);
    expect(isRequiredSkill("overdue_tasks", "get_project_members")).toBe(false);
    expect(isRequiredSkill("critical_issues", "get_open_issues")).toBe(true);
  });
});
