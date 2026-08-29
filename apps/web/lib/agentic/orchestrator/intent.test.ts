import { describe, expect, it } from "vitest";
import { resolveAgentIntent, skillsForIntent } from "./intent";

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
});
