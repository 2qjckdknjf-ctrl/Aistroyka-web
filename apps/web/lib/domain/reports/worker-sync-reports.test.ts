import { describe, expect, it } from "vitest";
import {
  filterWorkerSyncReportsDelta,
  mergeWorkerSyncReports,
  type WorkerSyncReportRow,
} from "./worker-sync-reports";

function row(
  id: string,
  status: string,
  created_at: string,
  submitted_at: string | null = null
): WorkerSyncReportRow {
  return { id, status, created_at, submitted_at };
}

describe("mergeWorkerSyncReports", () => {
  it("keeps older changes_requested even when recent window is full of newer drafts", () => {
    const feedback = [row("old-feedback", "changes_requested", "2026-01-01T00:00:00.000Z")];
    const recent = Array.from({ length: 50 }, (_, i) =>
      row(`draft-${i}`, "draft", `2026-07-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`)
    );

    const merged = mergeWorkerSyncReports(feedback, recent, 50);

    expect(merged).toHaveLength(50);
    expect(merged[0]?.id).toBe("old-feedback");
    expect(merged.some((r) => r.id === "old-feedback")).toBe(true);
    expect(merged.filter((r) => r.status === "draft")).toHaveLength(49);
  });

  it("dedupes feedback rows that also appear in recent", () => {
    const feedback = [row("same", "changes_requested", "2026-01-01T00:00:00.000Z")];
    const recent = [row("same", "changes_requested", "2026-01-01T00:00:00.000Z"), row("other", "draft", "2026-07-01T00:00:00.000Z")];
    const merged = mergeWorkerSyncReports(feedback, recent, 50);
    expect(merged.map((r) => r.id)).toEqual(["same", "other"]);
  });
});

describe("filterWorkerSyncReportsDelta", () => {
  it("keeps changes_requested when created_at/submitted_at are older than since", () => {
    const reports = [
      row("feedback", "changes_requested", "2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"),
      row("old-draft", "draft", "2026-01-01T00:00:00.000Z"),
      row("new-draft", "draft", "2026-07-20T00:00:00.000Z"),
    ];
    const filtered = filterWorkerSyncReportsDelta(reports, "2026-07-01T00:00:00.000Z");
    expect(filtered.map((r) => r.id)).toEqual(["feedback", "new-draft"]);
  });

  it("returns all rows when since is null", () => {
    const reports = [row("a", "draft", "2026-01-01T00:00:00.000Z")];
    expect(filterWorkerSyncReportsDelta(reports, null)).toEqual(reports);
  });
});
