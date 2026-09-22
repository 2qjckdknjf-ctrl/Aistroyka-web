import { describe, expect, it } from "vitest";
import { agentIdempotencyRoute } from "./idempotency";

describe("agentIdempotencyRoute", () => {
  it("does not share cache keys across projects", () => {
    expect(agentIdempotencyRoute("project-a")).toBe("POST /api/v1/projects/project-a/agent");
    expect(agentIdempotencyRoute("project-b")).toBe("POST /api/v1/projects/project-b/agent");
    expect(agentIdempotencyRoute("project-a")).not.toBe(agentIdempotencyRoute("project-b"));
  });
});
