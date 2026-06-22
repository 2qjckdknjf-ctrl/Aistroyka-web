import { describe, expect, it } from "vitest";
import {
  PUBLIC_WORKFLOW_LIVE_KEYS,
  PUBLIC_WORKFLOW_PATHS,
  PUBLIC_WORKFLOW_ROADMAP_KEYS,
  PUBLIC_WORKFLOW_TIMELINE_KEYS,
  publicWorkflowStatusKey,
} from "./public-workflows-inventory";

describe("public-workflows-inventory", () => {
  it("maps readiness to status keys", () => {
    expect(publicWorkflowStatusKey("live")).toBe("statusLive");
    expect(publicWorkflowStatusKey("partial")).toBe("statusPartial");
    expect(publicWorkflowStatusKey("planned")).toBe("statusPlanned");
  });

  it("keeps exactly one highlighted matrix path", () => {
    const highlighted = PUBLIC_WORKFLOW_PATHS.filter((p) => p.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]?.key).toBe("pathIssueNotify");
  });

  it("covers five workflow paths with explicit readiness", () => {
    expect(PUBLIC_WORKFLOW_PATHS).toHaveLength(5);
    expect(PUBLIC_WORKFLOW_TIMELINE_KEYS).toHaveLength(5);
    expect(PUBLIC_WORKFLOW_LIVE_KEYS).toHaveLength(5);
    expect(PUBLIC_WORKFLOW_ROADMAP_KEYS).toHaveLength(5);
  });

  it("marks automation engine as planned only", () => {
    const engine = PUBLIC_WORKFLOW_ROADMAP_KEYS.find((k) => k.key === "roadmapAutomationEngine");
    expect(engine?.readiness).toBe("planned");
  });
});
