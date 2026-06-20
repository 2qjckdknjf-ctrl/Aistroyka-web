import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { getProject } from "@/lib/domain/projects/project.service";
import { generateReportsExportCsv } from "@/lib/domain/reports/report-export.service";

export const dynamic = "force-dynamic";

const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";
const CSV_FILENAME = "reports-export.csv";

/** GET /api/v1/reports/export — read-only manager/admin CSV export with safe columns only. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  if (!ctx.tenantId || !ctx.userId || isLiteWorkerClient(ctx) || !canReviewReport(ctx) || ctx.role === "stakeholder") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const url = new URL(request.url);
  const projectId = normalizeParam(url.searchParams.get("project_id"));
  const status = normalizeParam(url.searchParams.get("status"));
  const from = normalizeParam(url.searchParams.get("from"));
  const to = normalizeParam(url.searchParams.get("to"));
  const rangeDays = parseRangeDays(url.searchParams.get("range_days"));
  const supabase = await createClientFromRequest(request);

  if (projectId) {
    const { data: project, error } = await getProject(supabase, ctx, projectId);
    if (error === "Insufficient rights") {
      return NextResponse.json({ error }, { status: 403 });
    }
    if (!project) {
      return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
    }
  }

  const csv = await generateReportsExportCsv(supabase, ctx.tenantId, {
    projectId,
    status,
    from,
    to,
    rangeDays,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": CSV_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${CSV_FILENAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function normalizeParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function parseRangeDays(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(Math.max(parsed, 1), 365);
}
