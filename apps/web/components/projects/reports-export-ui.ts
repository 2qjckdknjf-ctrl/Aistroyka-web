import type { TenantRoleDb } from "@/lib/tenant/tenant.types";

export function canShowProjectReportsExport(role: TenantRoleDb | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function buildProjectReportsExportHref(projectId: string): string {
  return `/api/v1/reports/export?project_id=${encodeURIComponent(projectId)}`;
}

export const DEFAULT_REPORTS_EXPORT_FILENAME = "reports-export.csv";

export function parseReportsExportFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return DEFAULT_REPORTS_EXPORT_FILENAME;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? DEFAULT_REPORTS_EXPORT_FILENAME;
}

export type ProjectReportsExportResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

type DownloadProjectReportsExportDeps = {
  fetchFn?: typeof fetch;
  triggerDownload?: (blob: Blob, filename: string) => void;
};

function defaultTriggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadProjectReportsExport(
  projectId: string,
  deps: DownloadProjectReportsExportDeps = {}
): Promise<ProjectReportsExportResult> {
  const fetchFn = deps.fetchFn ?? fetch;
  const triggerDownload = deps.triggerDownload ?? defaultTriggerDownload;

  try {
    const response = await fetchFn(buildProjectReportsExportHref(projectId), { credentials: "include" });
    if (!response.ok) {
      let message = response.statusText || "Export failed";
      try {
        const json = (await response.json()) as { error?: unknown };
        if (typeof json.error === "string" && json.error.trim()) {
          message = json.error;
        }
      } catch {
        // Non-JSON error body; keep status text fallback.
      }
      return { ok: false, error: message };
    }

    const blob = await response.blob();
    const filename = parseReportsExportFilename(response.headers.get("Content-Disposition"));
    triggerDownload(blob, filename);
    return { ok: true, filename };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Export failed" };
  }
}
