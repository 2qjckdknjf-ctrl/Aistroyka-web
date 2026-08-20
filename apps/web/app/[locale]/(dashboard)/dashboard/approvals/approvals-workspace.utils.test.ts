import { describe, expect, it } from "vitest";
import {
  approvalHref,
  approvalSelectionKey,
  countApprovalsByKind,
  filterApprovalsByKind,
  parseApprovalKindFilter,
  parseApprovalSelection,
  sortApprovalsOldestFirst,
} from "./approvals-workspace.utils";

describe("approvals-workspace.utils", () => {
  it("parses kind filter and selection keys", () => {
    expect(parseApprovalKindFilter(null)).toBe("all");
    expect(parseApprovalKindFilter("document")).toBe("document");
    expect(parseApprovalSelection("report:abc")).toEqual({ kind: "report", id: "abc" });
    expect(parseApprovalSelection("bad")).toBeNull();
    expect(approvalSelectionKey({ kind: "document", id: "d1" })).toBe("document:d1");
  });

  it("filters and counts by kind", () => {
    const items = [
      { kind: "report" as const, id: "r1", pending_at: "2026-08-20T10:00:00Z" },
      { kind: "document" as const, id: "d1", pending_at: "2026-08-19T10:00:00Z" },
      { kind: "report" as const, id: "r2", pending_at: "2026-08-18T10:00:00Z" },
    ];
    expect(filterApprovalsByKind(items, "report")).toHaveLength(2);
    expect(countApprovalsByKind(items)).toEqual({ all: 3, report: 2, document: 1 });
  });

  it("sorts oldest pending first and builds review hrefs", () => {
    const sorted = sortApprovalsOldestFirst([
      { id: "new", pending_at: "2026-08-20T10:00:00Z" },
      { id: "old", pending_at: "2026-08-18T10:00:00Z" },
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["old", "new"]);
    expect(approvalHref({ kind: "report", id: "r1", project_id: null })).toBe("/dashboard/reports/r1");
    expect(approvalHref({ kind: "document", id: "d1", project_id: "p1" })).toBe(
      "/dashboard/projects/p1?tab=documents",
    );
  });
});
