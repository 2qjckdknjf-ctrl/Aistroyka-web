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

  it("routes site-status questions only to the bounded site intelligence pack", () => {
    expect(resolveAgentIntent("Что сейчас видно на площадке по фото?")).toBe("site_status");
    expect(resolveAgentIntent("Show me visual progress from photo evidence")).toBe("site_status");
    const skills = skillsForIntent("site_status");
    expect(skills).toEqual([
      "get_project_state",
      "get_recent_reports",
      "get_site_observations",
    ]);
    expect(isRequiredSkill("site_status", "get_site_observations")).toBe(true);
    expect(skills).not.toContain("get_project_members");
  });
});
