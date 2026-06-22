import { describe, expect, it } from "vitest";
import {
  REPORT_EXPORT_COLUMNS,
  buildReportsCsv,
  escapeCsvValue,
  type ReportExportRow,
} from "./report-export.service";

const baseRow: ReportExportRow = {
  report_id: "report-1",
  project_id: "project-1",
  worker_user_id: "worker-1",
  status: "submitted",
  created_at: "2026-06-20T10:00:00.000Z",
  submitted_at: "2026-06-20T10:05:00.000Z",
  reviewed_at: null,
  media_count: 2,
  analysis_status: "success",
};

describe("report export CSV", () => {
  it("uses the approved safe column set only", () => {
    expect(REPORT_EXPORT_COLUMNS).toEqual([
      "report_id",
      "project_id",
      "worker_user_id",
      "status",
      "created_at",
      "submitted_at",
      "reviewed_at",
      "media_count",
      "analysis_status",
    ]);
  });

  it("builds header-only CSV for empty exports", () => {
    expect(buildReportsCsv([])).toBe(`${REPORT_EXPORT_COLUMNS.join(",")}\r\n`);
  });

  it("excludes forbidden finance, notes, and media URL columns", () => {
    const csv = buildReportsCsv([baseRow]);

    expect(csv).toContain("report_id,project_id,worker_user_id,status,created_at,submitted_at,reviewed_at,media_count,analysis_status");
    expect(csv).toContain("report-1,project-1,worker-1,submitted");
    expect(csv).not.toMatch(/planned_amount|actual_amount|margin|profitability|budget_pressure/i);
    expect(csv).not.toMatch(/manager_note|worker_note|note|comment/i);
    expect(csv).not.toMatch(/file_url|signed_url|media_url|storage/i);
  });

  it("quotes commas, quotes, and newlines", () => {
    expect(escapeCsvValue('a,b"c\nd')).toBe('"a,b""c\nd"');
  });

  it("guards spreadsheet formula injection", () => {
    expect(escapeCsvValue("=cmd")).toBe("'=cmd");
    expect(escapeCsvValue("+cmd")).toBe("'+cmd");
    expect(escapeCsvValue("-cmd")).toBe("'-cmd");
    expect(escapeCsvValue("@cmd")).toBe("'@cmd");
  });
});
