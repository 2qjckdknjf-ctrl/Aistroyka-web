import { describe, expect, it } from "vitest";
import {
  countAlertsBySeverity,
  countAlertsByStatus,
  filterAlertsBySeverity,
  filterAlertsByStatus,
  normalizeAlertSeverity,
  parseAlertSeverityFilter,
  parseAlertStatusFilter,
  sortAlertsByAttention,
} from "./alerts-workspace.utils";

describe("alerts-workspace.utils", () => {
  it("parses filters and normalizes severity aliases", () => {
    expect(parseAlertStatusFilter(null)).toBe("all");
    expect(parseAlertStatusFilter("unresolved")).toBe("unresolved");
    expect(parseAlertSeverityFilter("warn")).toBe("warn");
    expect(normalizeAlertSeverity("warning")).toBe("warn");
    expect(normalizeAlertSeverity("info")).toBe("info");
  });

  it("filters and counts by status/severity", () => {
    const items = [
      { id: "1", severity: "critical", created_at: "2026-08-20T10:00:00Z", resolved_at: null },
      { id: "2", severity: "warn", created_at: "2026-08-19T10:00:00Z", resolved_at: "2026-08-19T12:00:00Z" },
      { id: "3", severity: "info", created_at: "2026-08-18T10:00:00Z", resolved_at: null },
    ];
    expect(filterAlertsByStatus(items, "unresolved")).toHaveLength(2);
    expect(filterAlertsBySeverity(items, "critical")).toHaveLength(1);
    expect(countAlertsByStatus(items)).toEqual({ all: 3, unresolved: 2, resolved: 1 });
    expect(countAlertsBySeverity(items)).toEqual({ all: 3, critical: 1, warn: 1, info: 1 });
  });

  it("sorts unresolved + critical before older info", () => {
    const sorted = sortAlertsByAttention([
      { id: "info", severity: "info", created_at: "2026-08-21T10:00:00Z", resolved_at: null },
      { id: "crit", severity: "critical", created_at: "2026-08-19T10:00:00Z", resolved_at: null },
      { id: "done", severity: "critical", created_at: "2026-08-22T10:00:00Z", resolved_at: "2026-08-22T11:00:00Z" },
    ]);
    expect(sorted.map((a) => a.id)).toEqual(["crit", "info", "done"]);
  });
});
