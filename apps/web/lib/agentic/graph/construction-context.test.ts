import { describe, expect, it } from "vitest";
import { CONSTRUCTION_CONTEXT_MAPPING } from "./construction-context";
import { CONSTRUCTION_RELATION_TYPES } from "./construction-context";

describe("construction context mapping", () => {
  it("marks Task as existing worker_tasks system of record", () => {
    const task = CONSTRUCTION_CONTEXT_MAPPING.find((r) => r.entityType === "TASK");
    expect(task?.status).toBe("exists");
    expect(task?.sourceType).toBe("worker_tasks");
  });

  it("keeps spatial types as extensible graph types", () => {
    for (const t of ["BUILDING", "FLOOR", "ZONE", "ROOM"] as const) {
      expect(CONSTRUCTION_CONTEXT_MAPPING.find((r) => r.entityType === t)?.status).toBe("extensible_type");
    }
  });

  it("includes required relation types", () => {
    expect(CONSTRUCTION_RELATION_TYPES).toContain("EVIDENCED_BY");
    expect(CONSTRUCTION_RELATION_TYPES).toContain("BLOCKS");
  });
});
