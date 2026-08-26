import { describe, expect, it } from "vitest";
import {
  nextWorkerIssueDescription,
  workerIssuePatchError,
  workerIssueUpdatePayload,
} from "./worker-issue-patch";

describe("workerIssuePatchError", () => {
  it("blocks resolved and closed rows", () => {
    expect(workerIssuePatchError({ status: "resolved" })).toBe("Issue is closed");
    expect(workerIssuePatchError({ status: "closed" })).toBe("Issue is closed");
  });

  it("allows open and in_review", () => {
    expect(workerIssuePatchError({ status: "open" })).toBeNull();
    expect(workerIssuePatchError({ status: "in_review" })).toBeNull();
  });
});

describe("nextWorkerIssueDescription", () => {
  it("omits an empty note so the existing text is not wiped", () => {
    expect(nextWorkerIssueDescription("Fence missing", "  ")).toBeUndefined();
    expect(nextWorkerIssueDescription("Fence missing", undefined)).toBeUndefined();
    expect(nextWorkerIssueDescription("Fence missing", null)).toBeUndefined();
  });

  it("appends a new note instead of replacing", () => {
    expect(nextWorkerIssueDescription("Fence missing", "fixed")).toBe("Fence missing\nfixed");
  });

  it("keeps the first note when there is no existing text", () => {
    expect(nextWorkerIssueDescription(null, "fixed")).toBe("fixed");
  });
});

describe("workerIssueUpdatePayload", () => {
  it("drops title task and milestone", () => {
    expect(
      workerIssueUpdatePayload(
        {
          title: "wipe me",
          task_id: "t1",
          milestone_id: "m1",
          status: "in_review",
          description: "ignored here",
        },
        "Fence missing\nfixed"
      )
    ).toEqual({ status: "in_review", description: "Fence missing\nfixed" });
  });
});
