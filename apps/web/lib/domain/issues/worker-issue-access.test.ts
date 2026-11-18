import { describe, expect, it } from "vitest";
import { workerMayMutateIssue } from "./worker-issue-access";

describe("workerMayMutateIssue", () => {
  it("denies a missing actor", () => {
    expect(
      workerMayMutateIssue({ userId: null, createdBy: "u1", assignedTo: "u1" })
    ).toBe(false);
  });

  it("allows the reporter", () => {
    expect(
      workerMayMutateIssue({ userId: "u1", createdBy: "u1", assignedTo: null })
    ).toBe(true);
  });

  it("allows the assigned worker on the linked task", () => {
    expect(
      workerMayMutateIssue({ userId: "a2", createdBy: "u1", assignedTo: "a2" })
    ).toBe(true);
  });

  it("denies another project reader", () => {
    expect(
      workerMayMutateIssue({ userId: "other", createdBy: "u1", assignedTo: "a2" })
    ).toBe(false);
  });
});
