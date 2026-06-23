import { describe, expect, it, vi } from "vitest";
import {
  buildProjectReportsExportHref,
  canShowProjectReportsExport,
  downloadProjectReportsExport,
  parseReportsExportFilename,
} from "./reports-export-ui";

describe("project reports export UI helpers", () => {
  it("allows only tenant owner/admin roles", () => {
    expect(canShowProjectReportsExport("owner")).toBe(true);
    expect(canShowProjectReportsExport("admin")).toBe(true);
    expect(canShowProjectReportsExport("member")).toBe(false);
    expect(canShowProjectReportsExport("viewer")).toBe(false);
    expect(canShowProjectReportsExport("stakeholder")).toBe(false);
    expect(canShowProjectReportsExport(null)).toBe(false);
    expect(canShowProjectReportsExport(undefined)).toBe(false);
  });

  it("builds only the project-scoped reports export URL", () => {
    const href = buildProjectReportsExportHref("project 1/with/slash");
    const url = new URL(href, "https://example.test");

    expect(url.pathname).toBe("/api/v1/reports/export");
    expect(url.searchParams.get("project_id")).toBe("project 1/with/slash");
    expect(Array.from(url.searchParams.keys())).toEqual(["project_id"]);
  });

  it("does not include forbidden export scopes or filters", () => {
    const href = buildProjectReportsExportHref("project-1");

    expect(href).not.toMatch(/status|from|to|range_days/i);
    expect(href).not.toMatch(/cost|budget|finance|margin|profit/i);
    expect(href).not.toMatch(/customer|stakeholder|media|note|ai/i);
    expect(href).not.toMatch(/projects\/export/i);
  });

  it("parses CSV filename from Content-Disposition", () => {
    expect(parseReportsExportFilename('attachment; filename="reports-export.csv"')).toBe("reports-export.csv");
    expect(parseReportsExportFilename(null)).toBe("reports-export.csv");
  });

  it("downloads project reports CSV via /api/v1/reports/export", async () => {
    const triggerDownload = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("report_id,project_id\r\nreport-1,project-1\r\n", {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="reports-export.csv"',
        },
      })
    );

    const result = await downloadProjectReportsExport("project-1", { fetchFn, triggerDownload });

    expect(result).toEqual({ ok: true, filename: "reports-export.csv" });
    expect(fetchFn).toHaveBeenCalledWith("/api/v1/reports/export?project_id=project-1", { credentials: "include" });
    expect(triggerDownload).toHaveBeenCalledTimes(1);
    expect(triggerDownload.mock.calls[0]?.[1]).toBe("reports-export.csv");
  });

  it("returns API error message when export fails", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Insufficient rights" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await downloadProjectReportsExport("project-1", {
      fetchFn,
      triggerDownload: vi.fn(),
    });

    expect(result).toEqual({ ok: false, error: "Insufficient rights" });
  });

  it("returns network error when fetch throws", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Network down"));

    const result = await downloadProjectReportsExport("project-1", {
      fetchFn,
      triggerDownload: vi.fn(),
    });

    expect(result).toEqual({ ok: false, error: "Network down" });
  });
});
