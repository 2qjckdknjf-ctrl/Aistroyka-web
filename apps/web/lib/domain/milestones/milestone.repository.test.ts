import { describe, it, expect } from "vitest";
import * as repo from "./milestone.repository";

describe("milestone.repository", () => {
  it("create returns null when target_date is empty", async () => {
    const supabase = { from: () => ({}) } as any;
    const result = await repo.create(supabase, "tenant-1", {
      project_id: "proj-1",
      title: "M1",
      target_date: "",
    });
    expect(result).toBeNull();
  });
});
