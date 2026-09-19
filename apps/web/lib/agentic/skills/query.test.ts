import { describe, expect, it } from "vitest";
import { assertQueryOk } from "./query";
import { AgentError } from "../errors";

describe("assertQueryOk", () => {
  it("does not treat a query error as empty data", () => {
    expect(() => assertQueryOk({ message: "relation does not exist" }, "get_overdue_tasks")).toThrow(AgentError);
    try {
      assertQueryOk({ message: "db down" }, "get_overdue_tasks");
    } catch (e) {
      expect(e).toBeInstanceOf(AgentError);
      expect((e as AgentError).code).toBe("AGENT_SKILL_FAILED");
      expect((e as AgentError).message).toBe("query_failed:get_overdue_tasks");
    }
  });

  it("allows a successful empty result", () => {
    expect(() => assertQueryOk(null, "get_overdue_tasks")).not.toThrow();
  });
});
