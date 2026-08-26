import { describe, expect, it } from "vitest";
import {
  isWorkerAllowedIssueStatus,
  nextWorkerIssueDescription,
  workerMayMutateIssue,
} from "./issue.worker-patch";

describe("worker issue patch helpers", () => {
  it("allows only open and in_review statuses", () => {
    expect(isWorkerAllowedIssueStatus("open")).toBe(true);
    expect(isWorkerAllowedIssueStatus("in_review")).toBe(true);
    expect(isWorkerAllowedIssueStatus("resolved")).toBe(false);
    expect(isWorkerAllowedIssueStatus("closed")).toBe(false);
  });

  it("blocks mutation of resolved or closed issues", () => {
    expect(workerMayMutateIssue("open")).toBe(true);
    expect(workerMayMutateIssue("in_review")).toBe(true);
    expect(workerMayMutateIssue("resolved")).toBe(false);
    expect(workerMayMutateIssue("closed")).toBe(false);
  });

  it("does not wipe an existing description with empty incoming text", () => {
    expect(nextWorkerIssueDescription("Missing guardrail on floor 3", "")).toBeUndefined();
    expect(nextWorkerIssueDescription("Missing guardrail on floor 3", "   ")).toBeUndefined();
    expect(nextWorkerIssueDescription("Missing guardrail on floor 3", undefined)).toBeUndefined();
  });

  it("keeps the original description and appends a new resolution note", () => {
    expect(nextWorkerIssueDescription("Missing guardrail on floor 3", "fixed")).toBe(
      "Missing guardrail on floor 3\n\nfixed"
    );
  });

  it("does not duplicate when the client echoes the current description", () => {
    expect(
      nextWorkerIssueDescription("Missing guardrail on floor 3", "Missing guardrail on floor 3")
    ).toBeUndefined();
    expect(
      nextWorkerIssueDescription(
        "Missing guardrail on floor 3\n\nfixed",
        "fixed"
      )
    ).toBeUndefined();
  });

  it("accepts the first note when the issue had no description", () => {
    expect(nextWorkerIssueDescription(null, "Cannot reach the bay")).toBe("Cannot reach the bay");
    expect(nextWorkerIssueDescription("", "Cannot reach the bay")).toBe("Cannot reach the bay");
  });
});
